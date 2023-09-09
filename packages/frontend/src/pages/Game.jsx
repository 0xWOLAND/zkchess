import React from 'react'
import { Link } from 'react-router-dom'
import { observer } from 'mobx-react-lite'
import state from '../contexts/state'
import { Chessboard } from 'kokopu-react'
import { Position } from 'kokopu'

export default observer(() => {
  const { ui, msg, game } = React.useContext(state)

  return (
    <div>
      <button onClick={() => game.startGame()}>start game</button>
      <Chessboard
        interactionMode="playMoves"
        onMovePlayed={(move) => game.playMove(move)}
        position={game.activeGame}
      />
    </div>
  )
})
