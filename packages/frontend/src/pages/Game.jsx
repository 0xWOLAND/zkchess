import React from 'react'
import { Link } from 'react-router-dom'
import { observer } from 'mobx-react-lite'
import state from '../contexts/state'
import { Chessboard } from 'kokopu-react'
import { Position } from 'kokopu'

export default observer(() => {
  const { ui, msg, game } = React.useContext(state)
  const [gameId, setGameId] = React.useState('')

  return (
    <div>
      <button onClick={() => game.startGame()}>start game</button>
      <div>active game: {game.activeGame?._id}</div>
      <div>
        <input type="text" onChange={(e) => setGameId(e.target.value)} value={gameId} />
        <button onClick={() => game.joinGame(gameId)}>
        Join game
        </button>
      </div>
      <Chessboard
        interactionMode="playMoves"
        onMovePlayed={(move) => game.playMove(move)}
        position={game.activeGame?.position ?? new Position('start')}
      />
      {game.activeGame?.outcome ? (
        <div>
          Game over: {game.activeGame?.outcome}
        </div>
      ) : null}
    </div>
  )
})
