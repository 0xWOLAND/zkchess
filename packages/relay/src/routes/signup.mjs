import TransactionManager from '../singletons/TransactionManager.mjs'
import { SignupProof } from '@unirep/circuits'
import { APP_ADDRESS } from '../config.mjs'
import { createRequire } from 'module'
import { ethers } from 'ethers'

const require = createRequire(import.meta.url)
const UnirepAppABI = require('@zketh/contracts/abi/ZKEth.json')

export default ({ wsApp, db, synchronizer }) => {
  wsApp.handle("user.signup", async (data, send, next) => {
    await db.create("Player", {
      rating: 800,
    });
  wsApp.handle("user.register", async (data, send, next) => {
    const { proof, publicSignals } = data;
    const signupProof = new SignupProof(publicSignals, proof, synchronizer.prover)
      const valid = await signupProof.verify()
      if (!valid) {
        send(`invalid proof`, 1)
        return
      }
      const currentEpoch = synchronizer.calcCurrentEpoch()
      if (currentEpoch !== Number(BigInt(signupProof.epoch))) {
        send(`incorrect epoch in proof, expected ${currentEpoch} got ${signupProof.epoch}`, 1)
        return
      }
      // make a transaction lil bish
      const contract = new ethers.Contract(APP_ADDRESS, UnirepAppABI)
      // const contract =
      const calldata = contract.interface.encodeFunctionData(
        'signup',
        [signupProof.publicSignals, signupProof.proof]
      )
      const hash = await TransactionManager.queueTransaction(
        APP_ADDRESS,
        calldata,
      )
      send({ hash })
  });
};
