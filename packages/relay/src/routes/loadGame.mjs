export default ({ wsApp, db }) => {
  wsApp.handle("game.load", async (data, send, next) => {
    const { gameId } = data;
    if (!gameId) {
      send("no game id supplied", 1);
      return;
    }
    const game = await db.findOne("Game", {
      where: {
        _id: gameId,
      },
    });
    const black = await db.findOne('Player', {
      where: {
        _id: game.blackPlayerId,
      }
    })
    const white = await db.findOne('Player', {
      where: {
        _id: game.whitePlayerId,
      }
    })
    if (!game) {
      send(`no game found for id "${gameId}`, 1);
      return;
    }
    send({ ...game, black, white });
  });
};
