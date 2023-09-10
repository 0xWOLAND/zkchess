import React from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { observer } from "mobx-react-lite";
import state from "../contexts/state";
import { Chessboard } from "kokopu-react";
import { Position } from "kokopu";

export default observer(() => {
  const { ui, msg, game } = React.useContext(state);
  const { gameId } = useParams()
  const [moveTimer, setMoveTimer] = React.useState(null)
  const [whiteMoveTimer, setWhiteMoveTimer] = React.useState(0)
  const [blackMoveTimer, setBlackMoveTimer] = React.useState(0)

  React.useEffect(() => {
    game.joinGame(gameId)
  }, [])
  React.useEffect(() => {
    setMoveTimer(setInterval(() => {
      const g = new Position(game.activeGame?.position);
      const whiteToMove = g.turn() === 'w'
      const now = +new Date()
      if (whiteToMove) {
        setWhiteMoveTimer(Math.floor((game.activeGame?.whitePlayerTime - (now - game.activeGame?.lastMoveAt)) / 1000))
        setBlackMoveTimer(Math.floor(game.activeGame?.blackPlayerTime / 1000))
      } else {
        setBlackMoveTimer(Math.floor((game.activeGame?.blackPlayerTime - (now - game.activeGame?.lastMoveAt)) / 1000))
        setWhiteMoveTimer(Math.floor(game.activeGame?.whitePlayerTime / 1000))
      }
    const prevPosition = g.fen();

    }, 1000))
    return () => clearInterval(moveTimer)
  }, [])
  const flipped = game.color === 'b'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ display: 'flex' }}>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        {flipped ? (
          <>
            <div>
              <div>white rating: {game.activeGame?.white?.rating} elo</div>
              <div>white timer: {whiteMoveTimer}</div>
            </div>
            <div>
              <div>black rating: {game.activeGame?.black?.rating} elo</div>
              <div>black timer: {blackMoveTimer}</div>
            </div>
          </>
          ) :(
          <>
            <div>
              <div>black rating: {game.activeGame?.black?.rating} elo</div>
              <div>black timer: {blackMoveTimer}</div>
            </div>
            <div>
              <div>white rating: {game.activeGame?.white?.rating} elo</div>
              <div>white timer: {whiteMoveTimer}</div>
            </div>
          </>
          )}
        </div>
        <Chessboard
          flipped={flipped}
          interactionMode="playMoves"
          onMovePlayed={(move) => game.playMove(move)}
          position={game.activeGame?.position ?? new Position("start")}
        />
      </div>
      {game.activeGame?.outcome ? (
        <div>Game over: {game.activeGame?.outcome}</div>
      ) : null}
    </div>
  );
});
