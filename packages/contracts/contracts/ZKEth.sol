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
    // IVerifier immutable signupWithAddressVerifier;
    // IVerifier immutable signupNonAnonVerifier;

    Unirep public unirep;

    // bytes32 public immutable domainHash;

    constructor(Unirep _unirep) {
        // set unirep address
        unirep = _unirep;

        // sign up as an attester
        unirep.attesterSignUp(300);

        // signupWithAddressVerifier = _signupWithAddressVerifier;
        // signupNonAnonVerifier = _signupNonAnonVerifier;

        // domainHash = getEIP712DomainHash("zketh","0",block.chainid,address(this));
    }

    // function getEIP712DomainHash(string memory contractName, string memory version, uint256 chainId, address verifyingContract) public pure returns (bytes32) {
    //     bytes memory encoded = abi.encode(
    //       EIP712DOMAIN_TYPEHASH,
    //       keccak256(bytes(contractName)),
    //       keccak256(bytes(version)),
    //       chainId,
    //       verifyingContract
    //     );
    //     return keccak256(encoded);
    // }

    // function getSignupSigHash(SemaphoreKey memory input) public view returns (bytes32) {
    //     bytes32 digest = keccak256(
    //         abi.encodePacked(
    //             "\x19\x01",
    //             domainHash,
    //             GET_SEMAPHOREKEY_PACKETHASH(input)
    //         )
    //     );
    //     return digest;
    // }

    // TODO: restrict the caller of this function
    function signup(
        uint256[] memory publicSignals,
        uint256[8] memory proof
    ) public {
        unirep.userSignUp(publicSignals, proof);
    }

    // function signup(
    //     uint256[] memory publicSignals,
    //     uint256[8] memory proof
    // ) public {
    //     // Verify the proof
    //     require(signupWithAddressVerifier.verifyProof(publicSignals, proof), 'proof');

    //     // The expected message hash, in 4 limbs
    //     require(publicSignals[5] == 12742213206988075232, 'sig0');
    //     require(publicSignals[6] == 10620010067332803895, 'sig1');
    //     require(publicSignals[7] == 3731297768199697761, 'sig2');
    //     require(publicSignals[8] == 11874718941084289869, 'sig3');

    //     uint256 identityCommitment = publicSignals[0];
    //     uint256 stateTreeLeaf = publicSignals[1];
    //     uint256 data0 = publicSignals[2];

    //     uint256 attesterId = publicSignals[3];
    //     require(attesterId == uint256(uint160(address(this))), 'attstr');

    //     uint64 epoch = uint64(publicSignals[4]);

    //     uint256[] memory init = new uint256[](1);
    //     init[0] = data0;

    //     unirep.manualUserSignUp(
    //         epoch,
    //         identityCommitment,
    //         stateTreeLeaf,
    //         init
    //     );
    // }

    function attest(
        address attesterId,
        uint256 currentEpochKey,
        uint256 nextEpochKey,
        uint48 epoch,
        uint eloChange
    ) public {
        uint48 currentEpoch = unirep.attesterCurrentEpoch(uint160(attesterId));
        if (currentEpoch == epoch) {
            unirep.attest(currentEpochKey, epoch, 0, eloChange);
        } else if (currentEpoch + 1 == epoch) {
            unirep.attest(nextEpochKey, epoch, 0, eloChange);
        } else {
            revert();
        }
    }
}
