import PlayerQueue from "../singletons/PlayerQueue.mjs";
import { BaseProof } from '@unirep/circuits'
import prover from '../singletons/prover.mjs'

export default ({ wsApp, db, synchronizer }) => {
  wsApp.handle("queue.leave", async (data, send, next) => {
    const { playerId } = data;
    PlayerQueue.remove(playerId)
    send(0);
  });

  wsApp.handle("queue.join", async (data, send, next) => {
    const { ustProof, eloProof } = data
    const { prover } = synchronizer

  {
    const proof = new BaseProof(ustProof.publicSignals, ustProof.proof)
    await prover.verifyProof('userStateTransition', proof.publicSignals, proof._snarkProof)
  }
  {
    const proof = new BaseProof(eloProof.publicSignals, eloProof.proof)
    await prover.verifyProof('proveElo', proof.publicSignals, proof._snarkProof)
  }
    // new state tree leaf
    const id = ustProof.publicSignals[1]
    PlayerQueue.add(id.toString())
    send(0)
  });
};
