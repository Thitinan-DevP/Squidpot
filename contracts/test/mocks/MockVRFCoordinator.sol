// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { VRFV2PlusClient } from "@chainlink/contracts/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";

interface IVRFV2PlusConsumer {
    function rawFulfillRandomWords(
        uint256 requestId,
        uint256[] calldata randomWords
    ) external;
}

/// @notice Deterministic local coordinator for unit, fuzz, and invariant tests.
/// It intentionally exposes failure and callback-edge-case controls.
contract MockVRFCoordinator {
    struct MockRequest {
        address consumer;
        bytes32 keyHash;
        uint256 subId;
        uint16 requestConfirmations;
        uint32 callbackGasLimit;
        uint32 numWords;
        bytes32 extraArgsHash;
        bool exists;
    }

    uint256 public nextRequestId = 1;
    bool public failNextRequest;
    bool public synchronousCallback;
    uint256 public synchronousRandomWord;
    mapping(uint256 => MockRequest) public requests;

    event MockRequestCreated(uint256 indexed requestId, address indexed consumer);

    function requestRandomWords(
        VRFV2PlusClient.RandomWordsRequest calldata request
    ) external returns (uint256 requestId) {
        if (failNextRequest) {
            failNextRequest = false;
            revert("mock VRF request failed");
        }

        requestId = nextRequestId++;
        requests[requestId] = MockRequest({
            consumer: msg.sender,
            keyHash: request.keyHash,
            subId: request.subId,
            requestConfirmations: request.requestConfirmations,
            callbackGasLimit: request.callbackGasLimit,
            numWords: request.numWords,
            extraArgsHash: keccak256(request.extraArgs),
            exists: true
        });
        emit MockRequestCreated(requestId, msg.sender);

        if (synchronousCallback) {
            uint256[] memory words = new uint256[](1);
            words[0] = synchronousRandomWord;
            IVRFV2PlusConsumer(msg.sender).rawFulfillRandomWords(requestId, words);
        }
    }

    function setFailNextRequest(
        bool shouldFail
    ) external {
        failNextRequest = shouldFail;
    }

    function setNextRequestId(
        uint256 requestId
    ) external {
        nextRequestId = requestId;
    }

    function setSynchronousCallback(
        bool enabled,
        uint256 randomWord
    ) external {
        synchronousCallback = enabled;
        synchronousRandomWord = randomWord;
    }

    function fulfill(
        uint256 requestId,
        uint256 randomWord
    ) external {
        MockRequest memory request = requests[requestId];
        require(request.exists, "unknown mock request");
        uint256[] memory words = new uint256[](1);
        words[0] = randomWord;
        IVRFV2PlusConsumer(request.consumer).rawFulfillRandomWords(requestId, words);
    }

    function fulfillWithoutWords(
        uint256 requestId
    ) external {
        MockRequest memory request = requests[requestId];
        require(request.exists, "unknown mock request");
        uint256[] memory words = new uint256[](0);
        IVRFV2PlusConsumer(request.consumer).rawFulfillRandomWords(requestId, words);
    }

    function attemptUnknownCallback(
        address consumer,
        uint256 requestId,
        uint256 randomWord
    ) external {
        uint256[] memory words = new uint256[](1);
        words[0] = randomWord;
        IVRFV2PlusConsumer(consumer).rawFulfillRandomWords(requestId, words);
    }
}
