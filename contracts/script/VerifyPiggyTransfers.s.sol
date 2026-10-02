// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { Script } from "forge-std/Script.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @notice Performs a low-value Testnet transfer, approval, and transferFrom check.
contract VerifyPiggyTransfers is Script {
    address internal constant DIRECT_RECIPIENT = address(0x000000000000000000000000000000000000dEaD);
    address internal constant TRANSFER_FROM_RECIPIENT = address(0x000000000000000000000000000000000000bEEF);
    uint256 internal constant TEST_AMOUNT = 1 ether;

    function run() external returns (bool) {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);
        IERC20 token = IERC20(vm.envAddress("PIGGY_TOKEN_ADDRESS"));

        uint256 deployerBefore = token.balanceOf(deployer);
        uint256 directRecipientBefore = token.balanceOf(DIRECT_RECIPIENT);
        uint256 transferFromRecipientBefore = token.balanceOf(TRANSFER_FROM_RECIPIENT);

        vm.startBroadcast(deployerKey);
        token.transfer(DIRECT_RECIPIENT, TEST_AMOUNT);
        token.approve(deployer, TEST_AMOUNT);
        token.transferFrom(deployer, TRANSFER_FROM_RECIPIENT, TEST_AMOUNT);
        vm.stopBroadcast();

        require(token.balanceOf(deployer) == deployerBefore - 2 * TEST_AMOUNT, "deployer delta");
        require(token.balanceOf(DIRECT_RECIPIENT) == directRecipientBefore + TEST_AMOUNT, "transfer delta");
        require(
            token.balanceOf(TRANSFER_FROM_RECIPIENT) == transferFromRecipientBefore + TEST_AMOUNT,
            "transferFrom delta"
        );
        require(token.allowance(deployer, deployer) == 0, "allowance not consumed");
        require(token.totalSupply() == 100_000_000 ether, "total supply changed");
        return true;
    }
}
