// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { Test } from "forge-std/Test.sol";
import { DeploymentNetworkPolicy } from "../script/DeploymentNetworkPolicy.sol";

contract DeploymentNetworkPolicyHarness {
    function requireBnbSmartChainTestnet() external view {
        DeploymentNetworkPolicy.requireBnbSmartChainTestnet();
    }

    function validateVrfConfiguration(
        address coordinator,
        uint256 subscriptionId,
        bytes32 keyHash,
        uint32 callbackGasLimit,
        uint16 requestConfirmations
    ) external pure {
        DeploymentNetworkPolicy.validateVrfConfiguration(
            coordinator, subscriptionId, keyHash, callbackGasLimit, requestConfirmations
        );
    }
}

contract DeploymentNetworkPolicyTest is Test {
    address internal constant OFFICIAL_COORDINATOR = 0xDA3b641D438362C440Ac5458c57e00a712b66700;
    bytes32 internal constant OFFICIAL_KEY_HASH = 0x8596b430971ac45bdf6088665b9ad8e8630c9d5049ab54b14dff711bee7c0e26;

    DeploymentNetworkPolicyHarness internal harness;

    function setUp() public {
        harness = new DeploymentNetworkPolicyHarness();
    }

    function testRejectsLocalAnvilChain() public {
        vm.chainId(31_337);
        vm.expectRevert(abi.encodeWithSelector(DeploymentNetworkPolicy.UnsupportedDeploymentChain.selector, 31_337));
        harness.requireBnbSmartChainTestnet();
    }

    function testRejectsBnbMainnetChain() public {
        vm.chainId(56);
        vm.expectRevert(abi.encodeWithSelector(DeploymentNetworkPolicy.UnsupportedDeploymentChain.selector, 56));
        harness.requireBnbSmartChainTestnet();
    }

    function testAllowsBnbSmartChainTestnet() public {
        vm.chainId(97);
        harness.requireBnbSmartChainTestnet();
    }

    function testAllowsOfficialVrfV25Configuration() public view {
        harness.validateVrfConfiguration(OFFICIAL_COORDINATOR, 1, OFFICIAL_KEY_HASH, 500_000, 3);
    }

    function testRejectsZeroOrFormerAdapterCoordinator() public {
        vm.expectRevert(abi.encodeWithSelector(DeploymentNetworkPolicy.InvalidVrfCoordinator.selector, address(0)));
        harness.validateVrfConfiguration(address(0), 1, OFFICIAL_KEY_HASH, 500_000, 3);

        address formerAdapter = makeAddr("former-adapter");
        vm.expectRevert(abi.encodeWithSelector(DeploymentNetworkPolicy.InvalidVrfCoordinator.selector, formerAdapter));
        harness.validateVrfConfiguration(formerAdapter, 1, OFFICIAL_KEY_HASH, 500_000, 3);
    }

    function testRejectsMissingSubscriptionId() public {
        vm.expectRevert(DeploymentNetworkPolicy.InvalidVrfSubscriptionId.selector);
        harness.validateVrfConfiguration(OFFICIAL_COORDINATOR, 0, OFFICIAL_KEY_HASH, 500_000, 3);
    }

    function testRejectsWrongOrMissingKeyHash() public {
        vm.expectRevert(abi.encodeWithSelector(DeploymentNetworkPolicy.InvalidVrfKeyHash.selector, bytes32(0)));
        harness.validateVrfConfiguration(OFFICIAL_COORDINATOR, 1, bytes32(0), 500_000, 3);

        bytes32 wrongKeyHash = keccak256("wrong-key-hash");
        vm.expectRevert(abi.encodeWithSelector(DeploymentNetworkPolicy.InvalidVrfKeyHash.selector, wrongKeyHash));
        harness.validateVrfConfiguration(OFFICIAL_COORDINATOR, 1, wrongKeyHash, 500_000, 3);
    }

    function testRejectsInvalidCallbackGasLimit() public {
        vm.expectRevert(abi.encodeWithSelector(DeploymentNetworkPolicy.InvalidVrfCallbackGasLimit.selector, uint32(0)));
        harness.validateVrfConfiguration(OFFICIAL_COORDINATOR, 1, OFFICIAL_KEY_HASH, 0, 3);

        vm.expectRevert(
            abi.encodeWithSelector(DeploymentNetworkPolicy.InvalidVrfCallbackGasLimit.selector, uint32(2_500_001))
        );
        harness.validateVrfConfiguration(OFFICIAL_COORDINATOR, 1, OFFICIAL_KEY_HASH, 2_500_001, 3);
    }

    function testRejectsInvalidRequestConfirmations() public {
        vm.expectRevert(
            abi.encodeWithSelector(DeploymentNetworkPolicy.InvalidVrfRequestConfirmations.selector, uint16(2))
        );
        harness.validateVrfConfiguration(OFFICIAL_COORDINATOR, 1, OFFICIAL_KEY_HASH, 500_000, 2);

        vm.expectRevert(
            abi.encodeWithSelector(DeploymentNetworkPolicy.InvalidVrfRequestConfirmations.selector, uint16(201))
        );
        harness.validateVrfConfiguration(OFFICIAL_COORDINATOR, 1, OFFICIAL_KEY_HASH, 500_000, 201);
    }
}
