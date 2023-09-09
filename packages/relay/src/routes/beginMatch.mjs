export default ({ wsApp, db, synchronizer }) => {
  wsApp.handle("user.play", async (data, send, next) => {
    const players = await db.findMany("Player", {
      orderBy: {
        rating: "desc",
      },
    });
    const white = players[Math.floor(Math.random() * players.length)];
    const black = players[whitePlayerIdx + Math.floor(4 * Math.random() - 2)];

    const match = db.create("Match", {
      white,
      black,
    });
    send(match);
  });
};
