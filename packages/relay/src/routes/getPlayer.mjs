export default ({ wsApp, db }) => {
  wsApp.handle("game.getPlayer", async (data, send, next) => {
    const _playerId = data._id;
    const { _id, rating } = await db.findOne("Player", {
      where: {
        _id: _playerId,
      },
    });
    send({ playerId, rating });
    wsApp.broadcast(gameId, { position: position.fen() });
  });
};
