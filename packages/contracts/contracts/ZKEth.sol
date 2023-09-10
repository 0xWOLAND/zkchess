// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import {Unirep} from "@unirep/contracts/Unirep.sol";
import {EIP712Decoder, SemaphoreKey, EIP712DOMAIN_TYPEHASH, SEMAPHOREKEY_TYPEHASH} from "./EIP712.sol";

// Uncomment this line to use console.log
// import "hardhat/console.sol";

interface IVerifier {
    /**
     * @return bool Whether the proof is valid given the hardcoded verifying key
     *          above and the public inputs
     */
    function verifyProof(
        uint256[] calldata publicSignals,
        uint256[8] calldata proof
    ) external view returns (bool);
}

contract ZKEth is EIP712Decoder {
    Unirep public unirep;
    address immutable owner;

    // bytes32 public immutable domainHash;

    constructor(Unirep _unirep) {
        // set unirep address
        unirep = _unirep;

        // sign up as an attester
        unirep.attesterSignUp(24*60*60);
        owner = msg.sender;
    }

    function signup(
        uint256[] memory publicSignals,
        uint256[8] memory proof
    ) public {
        require(msg.sender == owner);
        unirep.userSignUp(publicSignals, proof);
    }

    function attest(
        uint256 currentEpochKey,
        uint256 nextEpochKey,
        uint48 epoch,
        uint eloChange
    ) public {
        require(msg.sender == owner);
        uint48 currentEpoch = unirep.attesterCurrentEpoch(uint160(address(this)));
        if (currentEpoch == epoch) {
            unirep.attest(currentEpochKey, epoch, 0, eloChange);
        } else if (currentEpoch + 1 == epoch) {
            unirep.attest(nextEpochKey, epoch, 0, eloChange);
        } else {
            revert();
        }
    }
}
