import React from 'react'
import { Outlet, Link } from 'react-router-dom'
import { observer } from 'mobx-react-lite'
import './header.css'
import state from '../contexts/state'
import Button from '../components/Button'

export default observer(() => {
  const { msg, auth } = React.useContext(state)
  return (
    <>
      <div className="header">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div
            style={{
              width: '10px',
              height: '10px',
              background: msg.connected ? 'green' : 'red',
              borderRadius: '10px',
            }}
          />
          <div style={{ width: '4px' }} />
          <div style={{ fontSize: '12px' }}>
            {msg.connected ? 'Connected' : 'Disconnected'}
          </div>
        </div>
        <div className="links">
          {(auth.synced && !auth.hasSignedUp) ? (
            <Button onClick={() => auth.signup()}>signup</Button>
            ) : null}
          {(auth.synced && auth.hasSignedUp) ? (
            <div>Current rating: {auth.rating.toString()}</div>
          ) : null}
          {!auth.synced ? <div>Syncing...</div> : null}
        </div>
      </div>

      <Outlet />
    </>
  )
})
