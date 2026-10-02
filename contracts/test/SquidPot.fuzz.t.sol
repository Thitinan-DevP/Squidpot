// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { SquidPotTestBase } from "./SquidPot.unit.t.sol";

contract SquidPotFuzzTest is SquidPotTestBase {
    function testFuzz_AccountingSurvivesRandomizedPlays(
        uint8 requestedPlays,
        uint256 seed
    ) public {
        uint256 plays = bound(uint256(requestedPlays), 0, 8);
        address charlie = makeAddr("charlie");
        address diana = makeAddr("diana");
        _fundAndApprove(charlie);
        _fundAndApprove(diana);

        address[4] memory players;
        players[0] = alice;
        players[1] = bob;
        players[2] = charlie;
        players[3] = diana;

        for (uint256 i = 0; i < plays; i++) {
            address player = players[seed % players.length];
            uint256 requestId = _play(player);
            // Both terminal paths are exercised without exceeding the ten-request cap.
            if ((seed & 1) == 1) {
                vrf.fulfill(requestId, seed % 10_000);
            }
            seed = uint256(keccak256(abi.encode(seed, i)));
            _assertSolvent();
        }

        assertLe(pot.activePendingRequests(), pot.MAX_PENDING_REQUESTS());
        assertGe(pot.contractBalance(), pot.totalLiabilities());
    }

    function testFuzz_RewardBoundaries(
        uint256 randomWord
    ) public view {
        uint256 roll = bound(randomWord, 0, 9_999);
        uint256 reward = pot.rewardForRoll(roll);
        if (roll < 8_000) assertEq(reward, 0);
        else if (roll < 9_500) assertEq(reward, 10 ether);
        else if (roll < 9_950) assertEq(reward, 20 ether);
        else assertEq(reward, 50 ether);
    }

    function testFuzz_DonationsOnlyIncreaseSurplus(
        uint128 donation
    ) public {
        uint256 amount = bound(uint256(donation), 0, 1_000 ether);
        uint256 liabilities = pot.totalLiabilities();
        piggy.transfer(address(pot), amount);
        assertEq(pot.totalLiabilities(), liabilities);
        assertEq(pot.accountingSurplus(), amount);
    }

    function testFuzz_EntryAllocationAlwaysBalances(
        uint8 requestedPlays
    ) public {
        uint256 plays = bound(uint256(requestedPlays), 0, 8);
        for (uint256 i = 0; i < plays; i++) {
            _play(alice);
            _assertSolvent();
        }
    }
}
