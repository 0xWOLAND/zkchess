import { Position } from "kokopu";
import { APP_ADDRESS } from "../config.mjs";
import { ethers } from "ethers";
import { createRequire } from "module";
import TransactionManager from "../singletons/TransactionManager.mjs";
import { BaseProof } from "@unirep/circuits";
import { F } from "@unirep/utils";
import prover from "../singletons/prover.mjs";

const require = createRequire(import.meta.url);
const UnirepAppABI = require("@zketh/contracts/abi/ZKEth.json");

export const handleGameEnd = async (
  position,
  game,
  db,
  synchronizer,
  { agreedToDraw, resign, color }
) => {
  let outcome;
  const white = await db.findOne("Player", {
    where: { _id: game.whitePlayerId },
  });
  const black = await db.findOne("Player", {
    where: { _id: game.blackPlayerId },
  });
  // update player ratings
  let eloChange = Math.ceil(
    1.0 / (1.0 + Math.pow(10, (white.rating - black.rating) / 400))
  );
  if (position.isStalemate() || position.isDead() || agreedToDraw) {
    outcome = "d";
    eloChange = Math.floor(eloChange * 0.3);
  } else if (position.isCheckmate()) {
    // player to move has lost
    outcome = position.turn() === "w" ? "b" : "w";
  } else if (resign) {
    outcome = color === "b" ? "w" : "b";
  } else return { white, black };

  const n = await db.update("Game", {
    where: {
      _id: game._id,
    },
    update: {
      position: position.fen(),
      lastMoveAt: +new Date(),
      ...(outcome ? { outcome } : {}),
    },
  });

  const winnerElo = (BigInt(eloChange) + F) % F;
  const loserElo = (F - BigInt(eloChange)) % F;

  console.log("attesting contracts...");
  const contract = new ethers.Contract(APP_ADDRESS, UnirepAppABI);
  {
    const { currentEpk, nextEpk, epoch } = white;
    console.log(currentEpk, nextEpk, epoch)
    const calldata = contract.interface.encodeFunctionData("attest", [
      currentEpk,
      nextEpk,
      epoch,
      outcome === "w" || outcome === "d" ? winnerElo : loserElo,
    ]);

    await TransactionManager.queueTransaction(APP_ADDRESS, calldata);
  }
  {
    const { currentEpk, nextEpk, epoch } = black;
    console.log(currentEpk, nextEpk, epoch)
    const calldata = contract.interface.encodeFunctionData("attest", [
      currentEpk,
      nextEpk,
      epoch,
      outcome === "b" || outcome === "d" ? winnerElo : loserElo,
    ]);

    await TransactionManager.queueTransaction(APP_ADDRESS, calldata);
  }
  console.log("finished game");
  return { black, white };
};

export default ({ wsApp, db, synchronizer }) => {
  wsApp.handle("game.draw", async (data, send, next) => {
    const { gameId, color } = data;
    const game = await db.findOne("Game", {
      where: {
        _id: gameId,
      },
    });

    const agreedToDraw = game.draw && draw;
    if (!game.draw && draw) {
      await db.findOne("Game", {
        where: {
          _id: gameId,
          draw: 1,
        },
      });
    } else {
      await db.update("Game", {
        where: {
          _id: gameId,
          draw: 0,
        },
      });
    }
    const position = new Position(game.position);
    const { black, white } = await handleGameEnd(
      position,
      game,
      db,
      synchronizer,
      {
        agreedToDraw,
        resign: false,
        color,
      }
    );
    wsApp.broadcast(gameId, {
      ...(await db.findOne("Game", { where: { _id: gameId } })),
      black,
      white,
    });
  });

  wsApp.handle("game.resign", async (data, send, next) => {
    console.log("resign data -- ", data);
    const { gameId, publicSignals, proof } = data;
    const game = await db.findOne("Game", {
      where: {
        _id: gameId,
      },
    });
    if (!game) {
      send('no game found', 1)
      return
    }
    {
      const _proof = new BaseProof(publicSignals, proof);
      await prover.verifyProof(
        "signMove",
        _proof.publicSignals,
        _proof._snarkProof
      );
    }
    if (publicSignals[0] !== game.whitePlayerId && publicSignals[0] !== game.blackPlayerId) {
      send(`incorrect player id`, 1);
      return;
    }
    const resign = Buffer.from(
      BigInt(publicSignals[1]).toString(16),
      "hex"
    ).toString("utf8");
    if (resign !== 'resign') {
      send('bad sig', 1)
      return
    }
    const position = new Position(game.position);

    const { black, white } = await handleGameEnd(
      position,
      game,
      db,
      synchronizer,
      {
        agreedToDraw: false,
        resign: true,
        color: publicSignals[0] === game.whitePlayerId ? 'w' : 'b',
      }
    );
    wsApp.broadcast(gameId, {
      ...(await db.findOne("Game", { where: { _id: gameId } })),
      black,
      white,
    });
  });

  wsApp.handle("game.playMove", async (data, send, next) => {
    const { publicSignals, proof, gameId } = data;
    if (!gameId) {
      send("no game id supplied", 1);
      return;
    }
    const game = await db.findOne("Game", {
      where: {
        _id: gameId,
      },
    });

    if (!game) {
      send(`no game found for id "${gameId}`, 1);
      return;
    }
    {
      const _proof = new BaseProof(publicSignals, proof);
      await prover.verifyProof(
        "signMove",
        _proof.publicSignals,
        _proof._snarkProof
      );
    }
    const position = new Position(game.position);

    const whiteToMove = position.turn() === "w";
    const expectedPlayerId = whiteToMove
      ? game.whitePlayerId
      : game.blackPlayerId;
    if (publicSignals[0] !== expectedPlayerId) {
      send(`incorrect player id`, 1);
      return;
    }
    const move = Buffer.from(
      BigInt(publicSignals[1]).toString(16),
      "hex"
    ).toString("utf8");
    if (!position.play(move)) {
      // move is illegal or string is invalid
      console.log("illegal move");
      send(`invalid or illegal move ${move}`, 1);
      return;
    }
    const { black, white, outcome } = await handleGameEnd(
      position,
      game,
      db,
      synchronizer,
      { agreedToDraw: false, resign: false }
    );

    const now = +new Date();
    const moveTime = now - game.lastMoveAt;

    const n = await db.update("Game", {
      where: {
        _id: gameId,
      },
      update: {
        position: position.fen(),
        lastMoveAt: now,
        ...(whiteToMove
          ? { whitePlayerTime: game.whitePlayerTime - moveTime }
          : { blackPlayerTime: game.blackPlayerTime - moveTime }),
        ...(outcome ? { outcome } : {}),
      },
    });
    if (n !== 1) {
      send(`failed to update game`, 1);
      return;
    }
    send("", 0);
    wsApp.broadcast(gameId, {
      ...(await db.findOne("Game", { where: { _id: gameId } })),
      black,
      white,
    });
  });
};
