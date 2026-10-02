// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { Script } from "forge-std/Script.sol";
import { SquidPot } from "../src/SquidPot.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeCast } from "@openzeppelin/contracts/utils/math/SafeCast.sol";
import { DeploymentNetworkPolicy } from "./DeploymentNetworkPolicy.sol";

contract DeploySquidPot is Script {
    using SafeCast for uint256;

    function run() external returns (SquidPot pot) {
        DeploymentNetworkPolicy.requireBnbSmartChainTestnet();
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        IERC20 token = IERC20(vm.envAddress("PIGGY_TOKEN_ADDRESS"));
        address academicTreasury = vm.envAddress("ACADEMIC_TREASURY_ADDRESS");
        address coordinator = vm.envAddress("VRF_COORDINATOR");
        uint256 subscriptionId = vm.envUint("VRF_SUBSCRIPTION_ID");
        bytes32 keyHash = vm.envBytes32("VRF_KEY_HASH");
        uint32 callbackGasLimit = vm.envUint("VRF_CALLBACK_GAS_LIMIT").toUint32();
        uint16 requestConfirmations = vm.envUint("VRF_REQUEST_CONFIRMATIONS").toUint16();
        bool payInNative = vm.envBool("VRF_PAY_IN_NATIVE");

        DeploymentNetworkPolicy.validateVrfConfiguration(
            coordinator, subscriptionId, keyHash, callbackGasLimit, requestConfirmations
        );

        vm.startBroadcast(deployerKey);
        pot = new SquidPot(
            token,
            coordinator,
            academicTreasury,
            subscriptionId,
            keyHash,
            callbackGasLimit,
            requestConfirmations,
            payInNative
        );
        vm.stopBroadcast();
    }
}
