// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { Script } from "forge-std/Script.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { IVRFCoordinatorV2Plus } from "@chainlink/contracts/src/v0.8/vrf/dev/interfaces/IVRFCoordinatorV2Plus.sol";
import { SquidPot } from "../src/SquidPot.sol";

contract PlaySquidPotSmokeTest is Script {
    error ContractNotInitialized();
    error ConsumerNotAuthorized();
    error IncorrectBillingMode();
    error InsufficientPlayerBalance(uint256 required, uint256 actual);
    error EntryFeeApprovalFailed();

    function run() external returns (uint256 requestId) {
        uint256 playerKey = vm.envUint("PRIVATE_KEY");
        address player = vm.addr(playerKey);
        SquidPot pot = SquidPot(vm.envAddress("SQUIDPOT_ADDRESS"));
        if (!pot.fundingInitialized()) revert ContractNotInitialized();
        if (!pot.vrfPayInNative()) revert IncorrectBillingMode();

        IVRFCoordinatorV2Plus coordinator = IVRFCoordinatorV2Plus(vm.envAddress("VRF_COORDINATOR"));
        uint256 subscriptionId = vm.envUint("VRF_SUBSCRIPTION_ID");
        (,,, address owner, address[] memory consumers) = coordinator.getSubscription(subscriptionId);
        if (owner != player) revert ConsumerNotAuthorized();
        bool isConsumer;
        for (uint256 i; i < consumers.length; ++i) {
            if (consumers[i] == address(pot)) isConsumer = true;
        }
        if (!isConsumer) revert ConsumerNotAuthorized();

        IERC20 token = IERC20(address(pot.piggy()));
        uint256 entryFee = pot.ENTRY_FEE();
        uint256 playerBalance = token.balanceOf(player);
        if (playerBalance < entryFee) revert InsufficientPlayerBalance(entryFee, playerBalance);

        vm.startBroadcast(playerKey);
        if (!token.approve(address(pot), entryFee)) revert EntryFeeApprovalFailed();
        requestId = pot.play();
        vm.stopBroadcast();
    }
}
