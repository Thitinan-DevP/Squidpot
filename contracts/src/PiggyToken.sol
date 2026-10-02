// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @notice Fixed-supply academic testnet token. There is intentionally no post-deployment mint path.
contract PiggyToken is ERC20 {
    uint256 public constant INITIAL_SUPPLY = 100_000_000 ether;

    constructor() ERC20("PIGGY", "PIGGY") {
        _mint(msg.sender, INITIAL_SUPPLY);
    }
}
