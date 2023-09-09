export default ({ wsApp, db }) => {
  wsApp.handle('game.create', async (data, send, next) => {
    const game = await db.create('Game', {})
    send(game)
  })
}
