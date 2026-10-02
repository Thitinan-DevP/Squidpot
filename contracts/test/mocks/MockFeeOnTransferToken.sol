// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @notice Used only to prove exact-receipt rejection; it is not a production token.
contract MockFeeOnTransferToken is ERC20 {
    uint256 public immutable feeBps;

    constructor(
        uint256 feeBasisPoints
    ) ERC20("Fee PIGGY", "fPIGGY") {
        require(feeBasisPoints < 10_000, "fee too high");
        feeBps = feeBasisPoints;
        _mint(msg.sender, 100_000_000 ether);
    }

    function _update(
        address from,
        address to,
        uint256 value
    ) internal override {
        if (from != address(0) && to != address(0) && feeBps != 0) {
            uint256 fee = value * feeBps / 10_000;
            super._update(from, to, value - fee);
            super._update(from, address(0x000000000000000000000000000000000000dEaD), fee);
        } else {
            super._update(from, to, value);
        }
    }
}
