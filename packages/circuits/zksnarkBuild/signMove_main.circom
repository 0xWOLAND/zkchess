pragma circom 2.0.0; include "../circuits/signMove.circom"; 

component main { public [ move_hash ] } = SignMove(6);