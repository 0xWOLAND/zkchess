import { Synchronizer } from '@unirep/core'
import { provider, UNIREP_ADDRESS, dbpath, APP_ADDRESS } from '../config.mjs'
import { SQLiteConnector } from 'anondb/node.js'
import prover from './prover.mjs'
// import { defaultProver } from '@unirep/circuits/provers/defaultProver.js'
import schema from './schema.mjs'

const db = await SQLiteConnector.create(schema, dbpath('sync.db'))
const s = new Synchronizer({
  db,
  provider,
  unirepAddress: UNIREP_ADDRESS,
  attesterId: APP_ADDRESS,
})
s.prover = prover
export default s
