// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @notice ERC-20 mock whose dead-address transfer can be failed on demand.
contract MockFailingBurnToken is ERC20 {
    bool public failBurn;

    constructor() ERC20("Failing PIGGY", "fPIGGY") {
        _mint(msg.sender, 100_000_000 ether);
    }

    function setFailBurn(
        bool shouldFail
    ) external {
        failBurn = shouldFail;
    }

    function _update(
        address from,
        address to,
        uint256 value
    ) internal override {
        if (failBurn && to == address(0x000000000000000000000000000000000000dEaD)) {
            revert("burn transfer failed");
        }
        super._update(from, to, value);
    }
}
