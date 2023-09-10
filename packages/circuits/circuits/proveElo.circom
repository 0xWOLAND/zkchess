pragma circom 2.1.0;

include "./unirep/packages/circuits/circuits/hasher.circom";

template ProveElo(FIELD_COUNT) {
    signal input data[FIELD_COUNT];
    signal input identity_secret;
    signal input attester_id;
    signal input epoch;

    signal output state_tree_leaf;
    signal output elo;
    signal output current_epk;
    signal output last_epk;

    component state_tree_leaf_hasher = StateTreeLeaf(FIELD_COUNT);
    state_tree_leaf_hasher.identity_secret <== identity_secret;
    state_tree_leaf_hasher.attester_id <== attester_id;
    state_tree_leaf_hasher.epoch <== epoch;
    state_tree_leaf_hasher.data <== data;

    state_tree_leaf <== state_tree_leaf_hasher.out;
    elo <== data[0];

    component current_epk_hasher = EpochKeyHasher();
    current_epk_hasher.identity_secret <== identity_secret;
    current_epk_hasher.attester_id <== attester_id;
    current_epk_hasher.epoch <== epoch;
    current_epk_hasher.nonce <== 0;

    current_epk <== current_epk_hasher.out;

    component last_epk_hasher = EpochKeyHasher();
    last_epk_hasher.identity_secret <== identity_secret;
    last_epk_hasher.attester_id <== attester_id;
    last_epk_hasher.epoch <== epoch-1;
    last_epk_hasher.nonce <== 0;

    last_epk <== last_epk_hasher.out;
}
