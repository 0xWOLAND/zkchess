import { ethers } from 'ethers'
import { Circuit, BuildOrderedTree } from '@unirep/circuits'
import { stringifyBigInts } from '@unirep/utils'
import TransactionManager from './TransactionManager.mjs'
import synchronizer from './AppSynchronizer.mjs'

class HashchainManager {
  latestSyncEpoch = 0
  async startDaemon() {
    return
    // first sync up all the historical epochs
    // then start watching
    await this.sync()
    for (;;) {
      // try to make a
      await new Promise((r) => setTimeout(r, 10000))
      await this.sync()
    }
  }

  async sync() {
    // Make sure we're synced up
    await synchronizer.waitForSync()
    const currentEpoch = synchronizer.calcCurrentEpoch()
    for (let x = this.latestSyncEpoch; x < currentEpoch; x++) {
      // check the owed keys
      if (synchronizer.provider.network.chainId === 31337) {
        // hardhat dev nodes need to have their state refreshed manually
        // for view only functions
        await synchronizer.provider.send('evm_mine', [])
      }
      const isSealed = await synchronizer.unirepContract.attesterEpochSealed(
        synchronizer.attesterId,
        x
      )
      if (!isSealed) {
        console.log('executing epoch', x)
        // otherwise we need to make an ordered tree
        await this.processEpochKeys(x)
        this.latestSyncEpoch = x
      } else {
        this.latestSyncEpoch = x
      }
    }
  }
}

export default new HashchainManager()
