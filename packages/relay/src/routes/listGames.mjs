export default ({ wsApp, db }) => {
  wsApp.handle('game.list', async (data, send, next) => {
    const games = await db.findMany('Game', {
      outcome: null,
    })
    send(games)
  })
}
