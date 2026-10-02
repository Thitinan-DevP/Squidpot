// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { Script } from "forge-std/Script.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SquidPot } from "../src/SquidPot.sol";

contract InitializeSquidPot is Script {
    error TreasuryMismatch(address expected, address actual);
    error AlreadyInitialized();
    error InsufficientTreasuryBalance(uint256 required, uint256 actual);
    error InitializationInvariantFailed();

    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);
        SquidPot pot = SquidPot(vm.envAddress("SQUIDPOT_ADDRESS"));
        address treasury = vm.envAddress("ACADEMIC_TREASURY_ADDRESS");
        if (deployer != treasury || pot.academicTreasury() != treasury) {
            revert TreasuryMismatch(treasury, deployer);
        }
        if (pot.fundingInitialized()) revert AlreadyInitialized();

        IERC20 token = IERC20(address(pot.piggy()));
        uint256 amount = pot.INITIAL_FUNDING();
        uint256 treasuryBalance = token.balanceOf(treasury);
        if (treasuryBalance < amount) revert InsufficientTreasuryBalance(amount, treasuryBalance);

        vm.startBroadcast(deployerKey);
        token.approve(address(pot), amount);
        pot.initializeFunding();
        vm.stopBroadcast();

        if (!pot.fundingInitialized() || token.balanceOf(address(pot)) != amount || pot.accountingSurplus() != 0) {
            revert InitializationInvariantFailed();
        }
    }
}
