// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

library DeploymentNetworkPolicy {
    uint256 internal constant BNB_SMART_CHAIN_TESTNET_CHAIN_ID = 97;
    address internal constant BNB_TESTNET_VRF_COORDINATOR = 0xDA3b641D438362C440Ac5458c57e00a712b66700;
    bytes32 internal constant BNB_TESTNET_VRF_KEY_HASH =
        0x8596b430971ac45bdf6088665b9ad8e8630c9d5049ab54b14dff711bee7c0e26;
    uint16 internal constant MIN_REQUEST_CONFIRMATIONS = 3;
    uint16 internal constant MAX_REQUEST_CONFIRMATIONS = 200;
    uint32 internal constant MAX_CALLBACK_GAS_LIMIT = 2_500_000;

    error UnsupportedDeploymentChain(uint256 chainId);
    error InvalidVrfCoordinator(address coordinator);
    error InvalidVrfSubscriptionId();
    error InvalidVrfKeyHash(bytes32 keyHash);
    error InvalidVrfCallbackGasLimit(uint32 callbackGasLimit);
    error InvalidVrfRequestConfirmations(uint16 requestConfirmations);

    function requireBnbSmartChainTestnet() internal view {
        if (block.chainid != BNB_SMART_CHAIN_TESTNET_CHAIN_ID) {
            revert UnsupportedDeploymentChain(block.chainid);
        }
    }

    function validateVrfConfiguration(
        address coordinator,
        uint256 subscriptionId,
        bytes32 keyHash,
        uint32 callbackGasLimit,
        uint16 requestConfirmations
    ) internal pure {
        if (coordinator != BNB_TESTNET_VRF_COORDINATOR) revert InvalidVrfCoordinator(coordinator);
        if (subscriptionId == 0) revert InvalidVrfSubscriptionId();
        if (keyHash != BNB_TESTNET_VRF_KEY_HASH) revert InvalidVrfKeyHash(keyHash);
        if (callbackGasLimit == 0 || callbackGasLimit > MAX_CALLBACK_GAS_LIMIT) {
            revert InvalidVrfCallbackGasLimit(callbackGasLimit);
        }
        if (requestConfirmations < MIN_REQUEST_CONFIRMATIONS || requestConfirmations > MAX_REQUEST_CONFIRMATIONS) {
            revert InvalidVrfRequestConfirmations(requestConfirmations);
        }
    }
}
