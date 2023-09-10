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
        await new Promise((r) => setTimeout(r, 1000));
        await this.buildMatches();
      }
    })();
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
    nextEpk
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
      }))
        return
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
          epoch: this.synchronizer.calcCurrentEpoch()
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
