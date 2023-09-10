import React from 'react'
import { useNavigate } from "react-router-dom";
import { observer } from 'mobx-react-lite'
import state from '../contexts/state'
import './queue.css'
import Button from './Button'

export default observer(({ onDone }) => {
  const navigate = useNavigate();
  const { ui, msg, auth, game } = React.useContext(state)
  const [addresses, setAddresses] = React.useState('')
  const [name, setName] = React.useState('')
  const [nameValid, setNameValid] = React.useState(null)
  const [message, setMessage] = React.useState('')
  const [canceled, setCanceled] = React.useState(false)

  const [inQueue, setInQueue] = React.useState(false)
  return (
    <div className="popup-out">
      <div className="popup-inner">
        <div
          style={{
            display: 'flex',
            flex: 1,
            justifyContent: 'space-between',
            alignItems: 'flex-end',
          }}
        >
          <div style={{ fontWeight: 'bold' }}>Players in queue: 10</div>
          <div style={{ flex: 1 }} />
          <Button style={{ fontSize: '12px' }} onClick={() => onDone()}>
            x
          </Button>
        </div>
        <div style={{ height: '4px' }} />
        <div>
          {message}
        </div>
        <div style={{ height: '4px' }} />
        <Button
          onClick={async () => {
            if (inQueue) {
              // leave queue
              console.log('hit')
              setCanceled(true)
              setMessage('Leaving queue...')
              msg.client.listen(
                "newGame",
                async ({ data: { gameId, white, black } }) => {})
              await game.leaveQueue()
              onDone()
              return
            }
            setInQueue(true)
            // await msg.createChannel(name, addresses)
            // await msg.loadChannels()
            // await msg.changeChannel(name)
            // onDone()
            msg.client.listen(
              "newGame",
              async ({ data: { gameId, white, black } }) => {
                console.log('found game!')
                if (game.playerId != white && game.playerId != black) return;
                const { data } = await msg.client.send("game.load", {
                  gameId,
                });
                game.activeGame = data
                msg.client.listen(gameId, ({ data }) => {
                  game.activeGame = data
                });
                navigate('/game')
              }
            );
            console.log('building zk proof')
            setMessage('Building proof of current rating...')
            await game.buildJoinProofs()
            setMessage('Joining queue...')
            await game.joinQueue()
            setMessage('Waiting for match...')
          }}
        >
          {inQueue ? 'Cancel' : 'Join Queue'}
        </Button>
      </div>
    </div>
  )
})
