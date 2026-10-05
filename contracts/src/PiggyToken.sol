// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @notice Academic testnet token with a one-time-per-address public faucet. This token is not fixed-supply.
contract PiggyToken is ERC20 {
    error FaucetAlreadyClaimed();

    uint256 public constant INITIAL_SUPPLY = 100_000_000 ether;
    uint256 public constant FAUCET_AMOUNT = 100 ether;

    mapping(address account => bool claimed) public hasClaimedFaucet;

    constructor() ERC20("PIGGY", "PIGGY") {
        _mint(msg.sender, INITIAL_SUPPLY);
    }

    /// @notice Mints 100 PIGGY to each address once for testnet gameplay.
    function faucet() external {
        if (hasClaimedFaucet[msg.sender]) revert FaucetAlreadyClaimed();
        hasClaimedFaucet[msg.sender] = true;
        _mint(msg.sender, FAUCET_AMOUNT);
    }
}
