import PlayerQueue from "../singletons/PlayerQueue.mjs";
import { BaseProof, UserStateTransitionProof } from "@unirep/circuits";
import prover from "../singletons/prover.mjs";
import { F } from '@unirep/utils'

export default ({ wsApp, db, synchronizer }) => {
  wsApp.handle("queue.leave", async (data, send, next) => {
    const { playerId } = data;
    await PlayerQueue.remove(playerId);
    send(0);
  });

  wsApp.handle("queue.join", async (data, send, next) => {
    const { ustProof: _ustProof, eloProof } = data;

    // TODO: verify the history root being proven
    const ustProof = new UserStateTransitionProof(
      _ustProof.publicSignals,
      _ustProof.proof
    );
    await prover.verifyProof(
      "userStateTransition",
      ustProof.publicSignals,
      ustProof._snarkProof
    );

    {
      console.log(eloProof)
      const proof = new BaseProof(eloProof.publicSignals, eloProof.proof);
      await prover.verifyProof(
        "proveElo",
        proof.publicSignals,
        proof._snarkProof
      );
    }
    if (
      eloProof.publicSignals[0].toString() !== ustProof.stateTreeLeaf.toString()
    ) {
      send("state tree leaf mismatch", 1);
      return;
    }
    const playerId = eloProof.publicSignals[0].toString()
    await db.create('PendingUST', {
      data: JSON.stringify(_ustProof),
      playerId,
      toEpoch: Number(eloProof.publicSignals[4])
    })
    const rating = (800n + BigInt(eloProof.publicSignals[1])) % F

    // new state tree leaf
    await PlayerQueue.add({
      _id: playerId,
      rating: Number(rating),
      currentEpk: eloProof.publicSignals[3].toString(),
      nextEpk: eloProof.publicSignals[2].toString(),
      epoch: Number(eloProof.publicSignals[4]) - 1
    });
    send(0);
  });
};
