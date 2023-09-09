pragma circom 2.1.0;

include "./unirep/packages/circuits/circuits/hasher.circom";

template ProveElo(FIELD_COUNT) {
    signal input data[FIELD_COUNT];
    signal input identity_secret;
    signal input attester_id;
    signal input epoch;

    signal output state_tree_leaf;
    signal output elo;

    component state_tree_leaf_hasher = StateTreeLeaf(FIELD_COUNT);
    state_tree_leaf_hasher.identity_secret <== identity_secret;
    state_tree_leaf_hasher.attester_id <== attester_id;
    state_tree_leaf_hasher.epoch <== epoch;
    state_tree_leaf_hasher.data <== data;

    state_tree_leaf <== state_tree_leaf_hasher.out;
    elo <== data[0];
}
