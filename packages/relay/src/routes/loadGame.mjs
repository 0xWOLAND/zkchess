export default ({ wsApp, db }) => {
  wsApp.handle('game.load', async (data, send, next) => {
    const { gameId } = data
    if (!gameId) {
      send('no game id supplied', 1)
      return
    }
    const game = await db.findOne('Game', {
      where: {
        _id: gameId
      }
    })
    if (!game) {
      send(`no game found for id "${gameId}`, 1)
      return
    }
    send(game)
  })
}
