import { UserStateTransitionProof } from '@unirep/circuits'
import { ethers } from 'ethers'
import TransactionManager from '../singletons/TransactionManager.mjs'

export default ({ wsApp, db, synchronizer }) => {
  wsApp.handle("user.transition", async (data, send, next) => {
    const { publicSignals, proof } = data
    const transitionProof = new UserStateTransitionProof(publicSignals, proof, synchronizer.prover)
    const valid = await transitionProof.verify()
    if (!valid) {
      send('invalid proof', 1)
      return
    }

    const calldata = synchronizer.unirepContract.interface.encodeFunctionData(
      'userStateTransition',
      [transitionProof.publicSignals, transitionProof.proof]
    )
    const hash = await TransactionManager.queueTransaction(
      synchronizer.unirepContract.address,
      calldata
    )
    send({ hash })
  })
}
