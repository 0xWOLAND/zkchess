export default ({ wsApp, db, synchronizer }) => {
  wsApp.handle("queue.get", async (data, send, next) => {
    const queue = await db.findMany("Player", {
      where: { rating: { gt: 0 } },
    });
    send(queue);
  });

  wsApp.handle("queue.leave", async (data, send, next) => {
    const { playerId } = data;
    const queue = await db.delete("Player", {
      where: { _id: playerId },
    });
    send(queue);
  });

  wsApp.handle("queue.check", async (data, send, next) => {
    const { playerId } = data;
    const queue = await db.findOne("Player", {
      where: { _id: playerId },
    });
    send(queue);
  });
};
