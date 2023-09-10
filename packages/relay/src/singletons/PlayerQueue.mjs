import { UserStateTransitionProof } from "@unirep/circuits";
import TransactionManager from './TransactionManager.mjs'

class PlayerQueue {
  // string[]
  configure(db, wsApp, synchronizer) {
    this.db = db;
    this.wsApp = wsApp;
    this.synchronizer = synchronizer
  }

  constructor() {
    (async () => {
      for (;;) {
        await new Promise((r) => setTimeout(r, 5000));
        await this.sendUST()
      }
    })();
    (async () => {
      for (;;) {
        await new Promise((r) => setTimeout(r, 1000));
        await this.buildMatches();
      }
    })();
  }

  async sendUST() {
    const activeGames = await this.db.findMany('Game', {
      where: {
        outcome: null
      }
    })
    const activePlayerIds = activeGames.map(({ blackPlayerId, whitePlayerId }) => [blackPlayerId, whitePlayerId]).flat()
    await this.db.delete('PendingUST', {
      where: {
        playerId: { nin: activePlayerIds }
      }
    })
    const pendingUSTs = await this.db.findMany('PendingUST', {
      where: {
        toEpoch: this.synchronizer.calcCurrentEpoch()
      }
    })

    for (const { _id, data } of pendingUSTs) {
      const { proof, publicSignals } = JSON.parse(data)
      const ustProof = new UserStateTransitionProof(
        publicSignals,
        proof
      );
      const calldata = this.synchronizer.unirepContract.interface.encodeFunctionData(
        'userStateTransition',
        [ustProof.publicSignals, ustProof.proof]
      )
      await TransactionManager.queueTransaction(
        this.synchronizer.unirepContract.address,
        calldata
      )
      await this.db.delete('PendingUST', {
        where: {
          _id
        }
      })
    }
  }

  async remove(playerId) {
    await this.db.delete('PlayerQueue', {
      where: {
        playerId,
      }
    })
  }

  async add({
    _id,
    rating,
    currentEpk,
    nextEpk,
    epoch,
  }) {
    await this.db.transaction(async _db => {
      if (await this.db.findOne('Game', {
        where: {
          outcome: null,
          OR: [
            { whitePlayerId: _id },
            { blackPlayerId: _id },
          ]
        }
      })) {
        throw new Error('Cannot join queue while in game')
      }
      if (!await this.db.findOne('Player', {
        where: {
          _id,
        }
      })) {
        _db.create('Player', {
          _id,
          rating,
          currentEpk,
          nextEpk,
          epoch,
        })
      }
      if (!await this.db.findOne('PlayerQueue', { where: { playerId: _id }})) {
        _db.create('PlayerQueue', {
          playerId: _id,
        })
      }
    })
  }

  async buildMatches() {
    const currentEpoch = this.synchronizer.calcCurrentEpoch()
    const gamePlayers = []
    await this.db.transaction(async _db => {
      const queue = await this.db.findMany("PlayerQueue", {});
      const players = await this.db.findMany('Player', {
        where : {
          _id: queue.map(v => v.playerId),
        }
      })
      const validPlayers = []
      const toRemove = []
      for (const player of players) {
        if (player.epoch !== currentEpoch) {
          toRemove.push(player._id)
        } else {
          validPlayers.push(player)
        }
      }
      // only rmeove the ones that timed out
      await _db.delete('PendingUST', {
        where: {
          playerId: toRemove
        }
      })
      // queue.sort((p1, p2) => p1.rating < p2.rating);
      while (validPlayers.length >= 2) {
        const white = validPlayers.pop()
        const black = validPlayers.pop()
        toRemove.push(white._id, black._id)
        gamePlayers.push({ white, black })
      }
      _db.delete('PlayerQueue', {
        where: {
          playerId: toRemove
        }
      })
    })
    for (const { white, black } of gamePlayers) {
      const game = await this.db.create("Game", {
        whitePlayerId: white._id,
        blackPlayerId: black._id,
        startedAtEpoch: this.synchronizer.calcCurrentEpoch(),
      });
      this.wsApp.broadcast("newGame", {
        gameId: game._id,
        white: white._id,
        black: black._id,
      });
    }
  }
}

export default new PlayerQueue();
