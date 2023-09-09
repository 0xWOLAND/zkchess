export default ({ wsApp, db, synchronizer }) => {
  wsApp.handle("user.register", async (data, send, next) => {
    const { playerId } = data;
    const player = db.create("Player", {
      playerId,
      rating: 800,
    });
    send(player);
  });
};
