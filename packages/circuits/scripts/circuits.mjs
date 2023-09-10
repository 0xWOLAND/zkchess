import { CircuitConfig } from '@unirep/circuits'
const {
    FIELD_COUNT,
} = CircuitConfig.default

const STATE_TREE_DEPTH = 20
const ADDRESS_TREE_DEPTH = 20

export const ptauName = 'powersOfTau28_hez_final_15.ptau'

export const circuitContents = {
    proveElo: `pragma circom 2.0.0; include "../circuits/proveElo.circom"; \n\ncomponent main { public [ epoch ] } = ProveElo(${FIELD_COUNT});`,
    signMove: `pragma circom 2.0.0; include "../circuits/signMove.circom"; \n\ncomponent main { public [ move_hash ] } = SignMove(${FIELD_COUNT});`,
}
