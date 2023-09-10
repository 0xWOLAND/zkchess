import { Position } from "kokopu";
import { APP_ADDRESS } from "../config.mjs";
import { ethers } from "ethers";
import { createRequire } from "module";
import TransactionManager from "../singletons/TransactionManager.mjs";
import { F } from '@unirep/utils'

const require = createRequire(import.meta.url);
const UnirepAppABI = require("@zketh/contracts/abi/ZKEth.json");

const handleGameEnd = async (position, game, db, synchronizer) => {
  let outcome;
  const white = await db.findOne("Player", { where: { _id: game.whitePlayerId } });
  const black = await db.findOne("Player", { where: { _id: game.blackPlayerId } });
  // update player ratings
  let eloChange =
    Math.ceil(1.0 / (1.0 + Math.pow(10, (white.rating - black.rating) / 400)))
  if (position.isStalemate() || position.isDead()) {
    outcome = "d";
    eloChange = Math.floor(eloChange * 0.3);
  } else if (position.isCheckmate()) {
    // player to move has lost
    outcome = position.turn() === "w" ? "b" : "w";
  } else return { outcome, white, black };

  const winnerElo = (BigInt(eloChange) + F) % F
  const loserElo = (F - BigInt(eloChange)) % F

  console.log("attesting contracts...");
  const contract = new ethers.Contract(APP_ADDRESS, UnirepAppABI);
  {
    const { currentEpk, nextEpk, epoch } = white;
    const calldata = contract.interface.encodeFunctionData("attest", [
      APP_ADDRESS,
      currentEpk,
      nextEpk,
      epoch,
      (outcome === 'w' || outcome === 'd') ? winnerElo : loserElo,
    ]);

    await TransactionManager.queueTransaction(APP_ADDRESS, calldata);
  }
  {
    const { currentEpk, nextEpk, epoch } = black;
    const calldata = contract.interface.encodeFunctionData("attest", [
      APP_ADDRESS,
      currentEpk,
      nextEpk,
      epoch,
      (outcome === 'b' || outcome === 'd') ? winnerElo : loserElo,
    ]);

    await TransactionManager.queueTransaction(APP_ADDRESS, calldata);
  }
  console.log("finished game");

  return { outcome, white, black };
};

export default ({ wsApp, db, synchronizer }) => {
  wsApp.handle("game.playMove", async (data, send, next) => {
    const { move, color, gameId } = data;
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
    const position = new Position(game.position);
    if (!position.play(move) || position.turn() != color) {
      // move is illegal or string is invalid
      console.log("illegal move");
      send(`invalid or illegal move ${move}`, 1);
      return;
    }
    const { outcome, black, white } = await handleGameEnd(position, game, db, synchronizer);

    const n = await db.update("Game", {
      where: {
        _id: gameId,
      },
      update: {
        position: position.fen(),
        lastMoveAt: +new Date(),
        ...(outcome ? { outcome } : {}),
      },
    });
    if (n !== 1) {
      send(`failed to update game`, 1);
      return;
    }
    send("", 0);
    wsApp.broadcast(
      gameId,
      {
        ...(await db.findOne("Game", { where: { _id: gameId } })),
        black, white,
      }
    );
  });
};
