class PlayerQueue {
  // string[]
  configure(db, wsApp) {
    this.db = db;
    this.wsApp = wsApp;
  }

  constructor() {
    (async () => {
      for (;;) {
        await new Promise((r) => setTimeout(r, 1000));
        await this.buildMatches();
      }
    })();
  }

  async add(_id) {
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
        rating: 800
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
        const white = queue.pop()._id;
        const black = queue.pop()._id;
        toRemove.push(white, black)
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
        white,
        black,
      });
      this.wsApp.broadcast("newGame", {
        gameId: game._id,
        white,
        black,
      });
    }
  }
}

export default new PlayerQueue();
