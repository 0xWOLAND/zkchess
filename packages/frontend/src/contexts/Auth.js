import { makeAutoObservable } from 'mobx'
import { ethers } from 'ethers'
import { Identity } from '@semaphore-protocol/identity'
import { UserState, schema } from '@unirep/core'
import { provider, UNIREP_ADDRESS, APP_ADDRESS, SERVER } from '../config'
// import prover from './prover'
import { fromRpcSig, hashPersonalMessage, ecrecover } from '@ethereumjs/util'
import BN from 'bn.js'
import poseidon from 'poseidon-lite'
import { TypedDataUtils } from '@metamask/eth-sig-util'
import { IndexedDBConnector, MemoryConnector } from 'anondb/web'
import { constructSchema } from 'anondb/types'
import prover from '@unirep/circuits/provers/web'

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

  messages = []

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
    await userState.sync.start()
    await userState.waitForSync()
    this.hasSignedUp = await userState.hasSignedUp()
    this.userState = userState
    this.watchTransition()
  }

  async watchTransition() {
    for (;;) {
      const time = this.userState.sync.calcEpochRemainingTime()
      const hasSignedUp = await this.userState.hasSignedUp()
      if (!hasSignedUp) {
        await new Promise(r => setTimeout(r, time * 1000))
        continue
      }
      const epoch = await this.userState.latestTransitionedEpoch()
      try {
        if (
          hasSignedUp &&
          epoch != this.userState.sync.calcCurrentEpoch()
        ) {
          await this.stateTransition()
        } else if (epoch != this.userState.sync.calcCurrentEpoch()) {
          await new Promise(r => setTimeout(r, 2000))
          continue
        }
      } catch (err) {
        await new Promise(r => setTimeout(r, 10000))
        continue
      }
      await new Promise(r => setTimeout(r, time * 1000))
    }
  }

  async signup() {
    // generate proof and send
    const signupProof = await this.userState.genUserSignUpProof()
    const { data } = await this.state.msg.client.send('user.register', {
      publicSignals: signupProof.publicSignals.map(v => v.toString()),
      proof: signupProof.proof.map(v => v.toString()),
    })
    console.log(data)
    await provider.waitForTransaction(data.hash)
    await this.userState.waitForSync()
    this.hasSignedUp = await this.userState.hasSignedUp()
  }

  async getSignupSignature() {
    if (!window.ethereum) throw new Error('No injected window.ethereum')
    if (!this.id) throw new Error('No identity loaded')
    if (!this.address) throw new Error('No address loaded')

    const CHAIN_ID = 421613

    const message = {
      domain: {
        chainId: CHAIN_ID, // arb goerli
        name: 'zketh',
        verifyingContract: APP_ADDRESS,
        version: '0',
      },
      message: {
        // whatami: '>zketh signup proof<',
        identity: '0x' + this.id.genIdentityCommitment().toString(16),
      },
      primaryType: 'SemaphoreKey',
      types: {
        SemaphoreKey: [
          // {
          //   name: 'whatami',
          //   type: 'string',
          // },
          {
            name: 'identity',
            type: 'uint256',
          },
        ],
        EIP712Domain: [
          { name: 'name', type: 'string' },
          { name: 'version', type: 'string' },
          { name: 'chainId', type: 'uint256' },
          { name: 'verifyingContract', type: 'address' },
        ],
      },
    }

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x' + BigInt(CHAIN_ID).toString(16) }],
      })
    } catch (err) {
      if (err.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: '0x' + BigInt(CHAIN_ID).toString(16),
              chainName: 'Arbitrum Goerli',
              nativeCurrency: {
                name: 'arbitrum eth',
                symbol: 'AGOR',
                decimals: 18,
              },
              rpcUrls: ['https://arbitrum.goerli.unirep.io'],
            },
          ],
        })
      } else {
        throw err
      }
    }

    const sig = await window.ethereum.request({
      method: 'eth_signTypedData_v4',
      params: [this.address, JSON.stringify(message)],
    })
    const hash = ethers.utils.keccak256(sig)
    console.log(
      BigInt(
        '0x' +
          Buffer.from(TypedDataUtils.eip712Hash(message, 'V4')).toString('hex')
      ).toString()
    )
    const sigHash = BigInt(hash) >> BigInt(6)
    return {
      sig,
      sigHash,
      msgHash:
        '0x' +
        Buffer.from(TypedDataUtils.eip712Hash(message, 'V4')).toString('hex'),
    }
  }

  async getProofSignature(address) {
    if (!window.ethereum) throw new Error('No injected window.ethereum')

    const CHAIN_ID = 421613

    const message = {
      domain: {
        chainId: CHAIN_ID, // arb goerli
        name: 'zketh',
        verifyingContract: APP_ADDRESS,
        version: '0',
      },
      message: {
        whatami: '>zketh unirep identity<',
        warning: 'do not sign outside of zketh.io',
      },
      primaryType: 'SemaphoreKey',
      types: {
        SemaphoreKey: [
          {
            name: 'whatami',
            type: 'string',
          },
          {
            name: 'warning',
            type: 'string',
          },
        ],
      },
    }

    this.hash = TypedDataUtils.eip712Hash(message, 'V4')

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x' + BigInt(CHAIN_ID).toString(16) }],
      })
    } catch (err) {
      if (err.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: '0x' + BigInt(CHAIN_ID).toString(16),
              chainName: 'Arbitrum Goerli',
              nativeCurrency: {
                name: 'arbitrum eth',
                symbol: 'AGOR',
                decimals: 18,
              },
              rpcUrls: ['https://arbitrum.goerli.unirep.io'],
            },
          ],
        })
      } else {
        throw err
      }
    }

    const sig = await window.ethereum.request({
      method: 'eth_signTypedData_v4',
      params: [address, JSON.stringify(message)],
    })
    this.address = address
    this.sig = sig
    const {
      default: { sha512 },
    } = await import(/* webpackPrefetch: true */ 'js-sha512')
    const h = sha512(sig).padStart(128, '0')
    const nullifier = BigInt('0x' + h.slice(0, 64)) >> BigInt(6)
    const trapdoor = BigInt('0x' + h.slice(64)) >> BigInt(6)
    this.id = new ZkIdentity(0)
    this.id._identityTrapdoor = trapdoor
    this.id._identityNullifier = nullifier
    this.id._secret = [nullifier, trapdoor]
  }
}
