// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @notice Academic testnet token with a public faucet. This token is not fixed-supply.
contract PiggyToken is ERC20 {
    uint256 public constant INITIAL_SUPPLY = 100_000_000 ether;
    uint256 public constant FAUCET_AMOUNT = 100 ether;

    constructor() ERC20("PIGGY", "PIGGY") {
        _mint(msg.sender, INITIAL_SUPPLY);
    }

    /// @notice Mints 100 PIGGY to the caller for testnet gameplay.
    function faucet() external {
        _mint(msg.sender, FAUCET_AMOUNT);
    }
}
