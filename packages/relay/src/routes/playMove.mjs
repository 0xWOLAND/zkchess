import { Position } from "kokopu";

export default ({ wsApp, db }) => {
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
    if (!position.play(move)) {
      // move is illegal or string is invalid
      send(`invalid or illegal move ${move}`, 1);
      return;
    }
    let outcome;
    const white = db.findOne("Player", { where: { _id: game.white } });
    const black = db.findOne("Player", { where: { _id: game.black } });
    // update player ratings
    const ratingChange =
      1.0 / (1.0 + Math.pow(10, (white.rating - black.rating) / 400));
    if (position.isStalemate() || position.isDead()) {
      outcome = "d";

      db.update("Player", {
        where: { _id: white.id, rating: white.rating + 0.3 * ratingChange },
      });
      db.update("Player", {
        where: { _id: black.id, rating: black.rating - 0.3 * ratingChange },
      });
    } else if (position.isCheckmate()) {
      // player to move has lost
      outcome = position.turn() === "w" ? "b" : "w";

      db.update("Player", {
        where: { _id: white.id, rating: white.rating + ratingChange },
      });
      db.update("Player", {
        where: { _id: black.id, rating: black.rating - ratingChange },
      });
    }

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
    send(0);
    wsApp.broadcast(
      gameId,
      await db.findOne("Game", { where: { _id: gameId } })
    );
  });
};
