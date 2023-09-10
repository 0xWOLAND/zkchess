import PlayerQueue from "../singletons/PlayerQueue.mjs";
import { BaseProof, UserStateTransitionProof } from '@unirep/circuits'
import prover from '../singletons/prover.mjs'

export default ({ wsApp, db, synchronizer }) => {
  wsApp.handle("queue.leave", async (data, send, next) => {
    const { playerId } = data;
    PlayerQueue.remove(playerId)
    send(0);
  });

  wsApp.handle("queue.join", async (data, send, next) => {
    const { ustProof: _ustProof, eloProof } = data
    const { prover } = synchronizer

    // TODO: verify the history root being proven
    const ustProof = new UserStateTransitionProof(_ustProof.publicSignals, _ustProof.proof)
    await prover.verifyProof('userStateTransition', ustProof.publicSignals, ustProof._snarkProof)

    {
      const proof = new BaseProof(eloProof.publicSignals, eloProof.proof)
      await prover.verifyProof('proveElo', proof.publicSignals, proof._snarkProof)
    }
    if (eloProof.publicSignals[0].toString() !== ustProof.stateTreeLeaf.toString()) {
      send('state tree leaf mismatch', 1)
      return
    }

    // new state tree leaf
    PlayerQueue.add({
      _id: eloProof.publicSignals[0].toString(),
      rating: Number(BigInt(eloProof.publicSignals[1])),
      currentEpk: eloProof.publicSignals[2].toString(),
      nextEpk: eloProof.publicSignals[3].toString(),
    })
    send(0)
  });
};
