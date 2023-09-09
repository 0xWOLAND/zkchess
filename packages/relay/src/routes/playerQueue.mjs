import PlayerQueue from '../singletons/PlayerQueue.mjs'

export default ({ wsApp, db, synchronizer }) => {
  wsApp.handle("queue.leave", async (data, send, next) => {
    const { playerId } = data;
    const queue = await db.delete("Player", {
      where: { _id: playerId },
    });
    send(queue);
  });

  wsApp.handle("queue.join", async (data, send, next) => {
    const { playerId } = data;
    const queue = await db.findOne("Player", {
      where: { _id: playerId },
    });
    send(queue);
  });
};
