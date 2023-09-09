export default ({ wsApp, db }) => {
  wsApp.handle("game.create", async (data, send, next) => {
    const { white, black } = data;
    const game = await db.create("Game", {});
    send(game);
    wsApp.broadcast("newGame", { gameId: game._id, white, black });
  });
};
