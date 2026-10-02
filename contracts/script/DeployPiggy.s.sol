// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { Script } from "forge-std/Script.sol";
import { PiggyToken } from "../src/PiggyToken.sol";
import { DeploymentNetworkPolicy } from "./DeploymentNetworkPolicy.sol";

contract DeployPiggy is Script {
    function run() external returns (PiggyToken token) {
        DeploymentNetworkPolicy.requireBnbSmartChainTestnet();
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerKey);
        token = new PiggyToken();
        vm.stopBroadcast();
    }
}
