pragma circom 2.0.0; include "../circuits/proveElo.circom"; 

component main { public [ epoch ] } = ProveElo(6);