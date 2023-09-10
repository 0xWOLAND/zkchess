import { makeAutoObservable } from 'mobx'
import { ethers } from 'ethers'
import { Identity } from '@semaphore-protocol/identity'
import { UserState, schema } from '@unirep/core'
import { BaseProof } from '@unirep/circuits'
import { provider, UNIREP_ADDRESS, APP_ADDRESS, SERVER } from '../config'
import prover from './prover'
import { fromRpcSig, hashPersonalMessage, ecrecover } from '@ethereumjs/util'
import BN from 'bn.js'
import poseidon from 'poseidon-lite'
import { TypedDataUtils } from '@metamask/eth-sig-util'
import { IndexedDBConnector, MemoryConnector } from 'anondb/web'
import { constructSchema } from 'anondb/types'
import { F } from '@unirep/utils'
// import prover from '@unirep/circuits/provers/web'

export default class Auth {
  addresses = []
  id = null
  sig = null
  hash = null
  address = null
  publicSignals = null
  proof = null

  userState = null
  addressTree = null
  hasSignedUp = false
  synced = false

  messages = []
  rating = 0

  treeCache = {}

  constructor(state) {
    makeAutoObservable(this)
    this.state = state
    this.load()
  }

  async load() {
    const id = localStorage.getItem('id') ?? undefined
    const identity = new Identity(id)
    if (!id) {
      localStorage.setItem('id', identity.toString())
    }

    const db = new MemoryConnector(constructSchema(schema))
    const userState = new UserState({
      db,
      provider,
      prover,
      unirepAddress: UNIREP_ADDRESS,
      attesterId: APP_ADDRESS,
      id: identity,
    })
    this.userState = userState
    await userState.sync.start()
    await userState.waitForSync()
    this.hasSignedUp = await userState.hasSignedUp()
    if (this.hasSignedUp) {
      await this.loadRating()
    }
    this.synced = true
    this.watchTransition()
  }

  async loadRating() {
    const currentEpoch = this.userState.sync.calcCurrentEpoch()
    const data = await this.userState.getData(currentEpoch)
    let rating = (data[0] + 800n + F) % F
    const attestations = await this.userState.sync.db.findMany('Attestation', {
      where: {
        epochKey: (await this.userState.getEpochKeys(currentEpoch, 0)).toString(),
        fieldIndex: 0
      },
    });
    for (const { change } of attestations) {
      rating += BigInt(change)
    }
    this.rating = rating % F
  }

  async watchTransition() {
    for (;;) {
      const time = this.userState.sync.calcEpochRemainingTime()
      console.log(time)
      const hasSignedUp = await this.userState.hasSignedUp()
      console.log(hasSignedUp)
      if (!hasSignedUp) {
        await new Promise(r => setTimeout(r, time * 1000))
        continue
      }
      const epoch = await this.userState.latestTransitionedEpoch()
      console.log(epoch, this.userState.sync.calcCurrentEpoch())
      try {
        if (
          hasSignedUp &&
          epoch != this.userState.sync.calcCurrentEpoch()
        ) {
          console.log('transitioning')
          const ustProof = await this.userState.genUserStateTransitionProof()
          const { data } = await this.state.msg.client.send('user.transition', {
            publicSignals: ustProof.publicSignals.map(v => v.toString()),
            proof: ustProof.proof.map(v => v.toString()),
          })
          await provider.waitForTransaction(data.hash)
        } else if (epoch != this.userState.sync.calcCurrentEpoch()) {
          await new Promise(r => setTimeout(r, 2000))
          continue
        }
      } catch (err) {
        console.log(err)
        await new Promise(r => setTimeout(r, 10000))
        continue
      }
      await new Promise(r => setTimeout(r, time * 1000))
      console.log('epoch ended')
    }
  }

  async signup() {
    // generate proof and send
    const signupProof = await this.userState.genUserSignUpProof()
    const { data } = await this.state.msg.client.send('user.register', {
      publicSignals: signupProof.publicSignals.map(v => v.toString()),
      proof: signupProof.proof.map(v => v.toString()),
    })
    await provider.waitForTransaction(data.hash)
    await this.userState.waitForSync()
    this.hasSignedUp = await this.userState.hasSignedUp()
    await this.loadRating()
  }

  async proveElo() {
    // first generate a UST proof
    const currentEpoch = this.userState.sync.calcCurrentEpoch()
    const toEpoch = currentEpoch + 1
    const ustProof = await this.userState.genUserStateTransitionProof({
      toEpoch,
    })
    // take the state tree leaf and the latest data
    const { stateTreeLeaf } = ustProof
    const data = await this.userState.getData()
    // build the elo proof using the resuting state tree leaf
    const id = localStorage.getItem('id')
    const identity = new Identity(id)
    const circuitInputs = {
      data,
      epoch: toEpoch,
      attester_id: APP_ADDRESS,
      identity_secret: identity.secret,
    }
    const { proof, publicSignals } = await prover.genProofAndPublicSignals('proveElo', circuitInputs)
    const eloProof = new BaseProof(publicSignals, proof)
    // now we have the UST proof and elo proof
    // send them to the server to find a game
    return { ustProof, eloProof, epoch: currentEpoch }
  }

}
