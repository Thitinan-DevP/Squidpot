// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { Script } from "forge-std/Script.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SquidPot } from "../src/SquidPot.sol";

contract ClaimSquidPotSmokeTestReward is Script {
    error NoPendingSmokeTestReward();
    error ClaimInvariantFailed();

    function run() external {
        uint256 playerKey = vm.envUint("PRIVATE_KEY");
        address player = vm.addr(playerKey);
        SquidPot pot = SquidPot(vm.envAddress("SQUIDPOT_ADDRESS"));
        uint256 amount = pot.pendingSlotRewards(player);
        if (amount == 0) revert NoPendingSmokeTestReward();

        IERC20 token = IERC20(address(pot.piggy()));
        uint256 playerBalanceBefore = token.balanceOf(player);
        vm.startBroadcast(playerKey);
        pot.claimSlotRewards();
        vm.stopBroadcast();

        if (pot.pendingSlotRewards(player) != 0 || token.balanceOf(player) != playerBalanceBefore + amount) {
            revert ClaimInvariantFailed();
        }
    }
}
