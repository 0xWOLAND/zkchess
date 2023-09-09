pragma circom 2.0.2;

include "../circomlib/circuits/mimcsponge.circom";
include "../circomlib/circuits/bitify.circom";
include "../../circuits/eth_addr.circom";

component main {public [privkey]} = PrivKeyToAddr(64, 4);
