// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { SafeCast } from "@openzeppelin/contracts/utils/math/SafeCast.sol";

contract NarrowingCastHarness {
    using SafeCast for uint256;

    function toUint96(
        uint256 value
    ) external pure returns (uint96) {
        return value.toUint96();
    }

    function toUint64(
        uint256 value
    ) external pure returns (uint64) {
        return value.toUint64();
    }
}
