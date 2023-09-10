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

  async add({
    _id,
    rating,
    currentEpk,
    nextEpk
  }) {
    await this.db.transaction(async _db => {
      // TODO: use unique index
      if (await this.db.findOne('Player', {
        where: { _id }
      })) return
      if (await this.db.findOne('Game', {
        where: {
          outcome: null,
          OR: [
            { white: _id },
            { black: _id },
          ]
        }
      }))
        return
      _db.create('Player', {
        _id,
        rating,
        currentEpk,
        nextEpk
      })
    })
  }

  async buildMatches() {
    const gamePlayers = []
    await this.db.transaction(async _db => {
      const queue = await this.db.findMany("Player", {});
      // queue.sort((p1, p2) => p1.rating < p2.rating);
      const toRemove = []
      while (queue.length >= 2) {
        const white = queue.pop()
        const black = queue.pop()
        toRemove.push(white._id, black._id)
        gamePlayers.push({ white, black })
      }
      _db.delete('Player', {
        where: {
          _id: toRemove
        }
      })
    })
    for (const { white, black } of gamePlayers) {
      const game = await this.db.create("Game", {
        white: white._id,
        white_current_epk: white.currentEpk,
        white_next_epk: white.nextEpk,
        black: black._id,
        black_current_epk: black.currentEpk,
        black_next_epk: black.nextEpk,
        startedAtEpoch: synchronizer.calcCurrentEpoch(),
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
