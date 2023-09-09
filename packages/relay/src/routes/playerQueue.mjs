import PlayerQueue from "../singletons/PlayerQueue";
export default ({ wsApp, db, synchronizer }) => {
  wsApp.handle("queue.join", async (data, send, next) => {
    const { playerId } = data;
    const player = await db.findOne("Player", {
      where: { _id: playerId, rating: { gt: 0 } },
    });

    PlayerQueue.addPlayer(player);
  });
};
