import PlayerQueue from "../singletons/PlayerQueue.mjs";

export default ({ wsApp, db, synchronizer }) => {
  wsApp.handle("queue.leave", async (data, send, next) => {
    const { playerId } = data;
    PlayerQueue.remove(playerId)
    send(0);
  });

  wsApp.handle("queue.join", async (data, send, next) => {
    const { ustProof, eloProof } = data
    // TODO verify

    // new state tree leaf
    const id = ustProof.publicSignals[1]
    PlayerQueue.add(id.toString())
    send(0)
  });
};
