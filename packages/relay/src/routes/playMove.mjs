import { Position } from 'kokopu'

export default ({ wsApp, db }) => {
  wsApp.handle('game.playMove', async (data, send, next) => {
    const { move, color, gameId } = data
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
    const position = new Position(game.position)
    if (!position.play(move)) {
      // move is illegal or string is invalid
      send(`invalid or illegal move ${move}`, 1)
      return
    }
    const n = await db.update('Game', {
      where: {
        _id: gameId,
      },
      update: {
        position: position.fen()
      }
    })
    if (n !== 1) {
      send(`failed to update game`, 1)
      return
    }
    send(0)
    wsApp.broadcast(gameId, { position: position.fen() })
  })
}