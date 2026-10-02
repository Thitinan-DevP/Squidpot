// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { Script } from "forge-std/Script.sol";
import { IVRFCoordinatorV2Plus } from "@chainlink/contracts/src/v0.8/vrf/dev/interfaces/IVRFCoordinatorV2Plus.sol";
import { SquidPot } from "../src/SquidPot.sol";

contract AddSquidPotConsumer is Script {
    error SubscriptionOwnerMismatch(address expected, address actual);
    error ConsumerAlreadyAuthorized(address consumer);
    error ConsumerConfigurationMismatch();

    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);
        IVRFCoordinatorV2Plus coordinator = IVRFCoordinatorV2Plus(vm.envAddress("VRF_COORDINATOR"));
        uint256 subscriptionId = vm.envUint("VRF_SUBSCRIPTION_ID");
        address consumer = vm.envAddress("SQUIDPOT_ADDRESS");
        address expectedToken = vm.envAddress("PIGGY_TOKEN_ADDRESS");
        address expectedTreasury = vm.envAddress("ACADEMIC_TREASURY_ADDRESS");

        SquidPot pot = SquidPot(consumer);
        if (
            consumer.code.length == 0 || address(pot.piggy()) != expectedToken
                || pot.academicTreasury() != expectedTreasury || pot.vrfSubscriptionId() != subscriptionId
        ) {
            revert ConsumerConfigurationMismatch();
        }

        (,,, address owner, address[] memory consumers) = coordinator.getSubscription(subscriptionId);
        if (owner != deployer) revert SubscriptionOwnerMismatch(deployer, owner);
        for (uint256 i; i < consumers.length; ++i) {
            if (consumers[i] == consumer) revert ConsumerAlreadyAuthorized(consumer);
        }

        vm.startBroadcast(deployerKey);
        coordinator.addConsumer(subscriptionId, consumer);
        vm.stopBroadcast();
    }
}
