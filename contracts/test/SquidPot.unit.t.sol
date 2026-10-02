// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { Test } from "forge-std/Test.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { VRFConsumerBaseV2Plus } from "@chainlink/contracts/src/v0.8/vrf/dev/VRFConsumerBaseV2Plus.sol";
import { VRFV2PlusClient } from "@chainlink/contracts/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";
import { PiggyToken } from "../src/PiggyToken.sol";
import { SquidPot } from "../src/SquidPot.sol";
import { MockVRFCoordinator } from "./mocks/MockVRFCoordinator.sol";
import { MockFeeOnTransferToken } from "./mocks/MockFeeOnTransferToken.sol";
import { MockFailingBurnToken } from "./mocks/MockFailingBurnToken.sol";
import { NarrowingCastHarness } from "./mocks/NarrowingCastHarness.sol";

contract SquidPotTestBase is Test {
    uint256 internal constant VRF_SUBSCRIPTION_ID = 1;
    bytes32 internal constant VRF_KEY_HASH = keccak256("local-vrf-key-hash");
    uint32 internal constant VRF_CALLBACK_GAS_LIMIT = 500_000;
    uint16 internal constant VRF_REQUEST_CONFIRMATIONS = 3;
    bool internal constant VRF_PAY_IN_NATIVE = true;

    PiggyToken internal piggy;
    MockVRFCoordinator internal vrf;
    SquidPot internal pot;
    NarrowingCastHarness internal castHarness;

    address internal treasury = makeAddr("academic-treasury");
    address internal alice = makeAddr("alice");
    address internal bob = makeAddr("bob");

    function setUp() public virtual {
        piggy = new PiggyToken();
        vrf = new MockVRFCoordinator();
        pot = _newSquidPot(IERC20(address(piggy)), vrf, treasury);
        castHarness = new NarrowingCastHarness();

        piggy.transfer(treasury, pot.INITIAL_FUNDING());
        _fundAndApprove(alice);
        _fundAndApprove(bob);
        vm.startPrank(treasury);
        piggy.approve(address(pot), pot.INITIAL_FUNDING());
        pot.initializeFunding();
        vm.stopPrank();
    }

    function _fundAndApprove(
        address account
    ) internal {
        piggy.transfer(account, 1_000 ether);
        vm.prank(account);
        piggy.approve(address(pot), type(uint256).max);
    }

    function _newSquidPot(
        IERC20 token,
        MockVRFCoordinator coordinator,
        address academicTreasury
    ) internal returns (SquidPot) {
        return new SquidPot(
            token,
            address(coordinator),
            academicTreasury,
            VRF_SUBSCRIPTION_ID,
            VRF_KEY_HASH,
            VRF_CALLBACK_GAS_LIMIT,
            VRF_REQUEST_CONFIRMATIONS,
            VRF_PAY_IN_NATIVE
        );
    }

    function _play(
        address player
    ) internal returns (uint256 requestId) {
        vm.prank(player);
        requestId = pot.play();
    }

    function _assertSolvent() internal view {
        assertGe(pot.contractBalance(), pot.totalLiabilities());
        assertEq(pot.contractBalance() - pot.totalLiabilities(), pot.accountingSurplus());
    }
}

contract SquidPotUnitTest is SquidPotTestBase {
    function testFixedSupplyAndTokenMetadata() public view {
        assertEq(piggy.totalSupply(), 100_000_000 ether);
        assertEq(piggy.decimals(), 18);
        assertEq(piggy.balanceOf(address(this)), 100_000_000 ether - pot.INITIAL_FUNDING() - 2_000 ether);
    }

    function testInitializationCannotRunTwice() public {
        vm.prank(treasury);
        vm.expectRevert(SquidPot.AlreadyInitialized.selector);
        pot.initializeFunding();
    }

    function testOnlyAcademicTreasuryCanInitialize() public {
        SquidPot fresh = _newSquidPot(IERC20(address(piggy)), vrf, treasury);
        address sponsor = makeAddr("unauthorized-sponsor");
        piggy.transfer(sponsor, fresh.INITIAL_FUNDING());
        vm.startPrank(sponsor);
        piggy.approve(address(fresh), fresh.INITIAL_FUNDING());
        vm.expectRevert(SquidPot.NotAcademicTreasury.selector);
        fresh.initializeFunding();
        vm.stopPrank();
        assertFalse(fresh.fundingInitialized());
    }

    function testAcademicTreasuryCanInitializeWithExactFundsOnlyOnce() public {
        SquidPot fresh = _newSquidPot(IERC20(address(piggy)), vrf, treasury);
        piggy.transfer(treasury, fresh.INITIAL_FUNDING());
        vm.startPrank(treasury);
        piggy.approve(address(fresh), fresh.INITIAL_FUNDING());
        fresh.initializeFunding();
        vm.expectRevert(SquidPot.AlreadyInitialized.selector);
        fresh.initializeFunding();
        vm.stopPrank();
        assertTrue(fresh.fundingInitialized());
    }

    function testPlayCannotRunBeforeInitialization() public {
        SquidPot fresh = _newSquidPot(IERC20(address(piggy)), vrf, treasury);
        vm.prank(alice);
        vm.expectRevert(SquidPot.NotInitialized.selector);
        fresh.play();
    }

    function testIncompleteInitializationFundingReverts() public {
        SquidPot fresh = _newSquidPot(IERC20(address(piggy)), vrf, treasury);
        vm.prank(treasury);
        piggy.approve(address(fresh), fresh.INITIAL_FUNDING() - 1);
        vm.expectRevert();
        fresh.initializeFunding();
        assertFalse(fresh.fundingInitialized());
    }

    function testExactFundingReceiptRejectsFeeOnTransferToken() public {
        MockFeeOnTransferToken feeToken = new MockFeeOnTransferToken(100);
        SquidPot feePot = _newSquidPot(IERC20(address(feeToken)), vrf, treasury);
        feeToken.transfer(treasury, 110_000 ether);
        vm.startPrank(treasury);
        feeToken.approve(address(feePot), type(uint256).max);
        vm.expectRevert();
        feePot.initializeFunding();
        vm.stopPrank();
        assertFalse(feePot.fundingInitialized());
    }

    function testEntryAllocationAndSelfPlayRollover() public {
        uint256 requestId = _play(alice);
        assertEq(pot.currentPrizePool(), 100_004 ether);
        assertEq(pot.availableSlotReserve(), 453 ether);
        assertEq(pot.reservedSlotLiability(), 50 ether);
        assertEq(pot.rolloverReserve(), 2.5 ether);
        assertEq(pot.totalPendingPreviousRewards(), 0);
        _assertSolvent();

        vrf.fulfill(requestId, 0);
        _play(alice);
        assertEq(pot.pendingPreviousRewards(alice), 0);
        assertEq(pot.rolloverReserve(), 5 ether);
        _assertSolvent();
    }

    function testPreviousPlayerRewardGoesToPriorWallet() public {
        uint256 first = _play(alice);
        vrf.fulfill(first, 0);
        _play(bob);
        assertEq(pot.pendingPreviousRewards(alice), 1.5 ether);
        assertEq(pot.totalPendingPreviousRewards(), 1.5 ether);
        assertEq(pot.rolloverReserve(), 3.5 ether);
        _assertSolvent();
    }

    function testRoundWaitingHasNoCountdownAndCannotSettle() public {
        assertEq(uint256(pot.roundStatus()), uint256(SquidPot.RoundPhase.WAITING));
        assertEq(pot.roundStartedAt(), 0);
        assertEq(pot.deadline(), 0);
        assertEq(pot.hardDeadline(), 0);
        assertEq(pot.lastPlayer(), address(0));
        vm.expectRevert(SquidPot.RoundIsWaiting.selector);
        pot.settleRound();
    }

    function testRoundOpenDeadlineHardCapAndPermissionlessSettlement() public {
        uint256 requestId = _play(alice);
        uint256 start = pot.roundStartedAt();
        uint256 hard = pot.hardDeadline();
        assertEq(pot.deadline(), start + 3 minutes);
        assertLe(pot.deadline(), hard);

        vm.warp(start + 1 minutes);
        vrf.fulfill(requestId, 0);
        _play(bob);
        assertEq(pot.deadline(), block.timestamp + 3 minutes);
        assertLe(pot.deadline(), hard);

        vm.warp(pot.deadline());
        vm.prank(makeAddr("settler"));
        pot.settleRound();
        assertEq(pot.currentRoundId(), 2);
        assertEq(pot.pendingPrizes(bob), 100_008 ether);
        assertEq(pot.currentPrizePool(), 3.5 ether);
        assertEq(pot.rolloverReserve(), 0);
        assertEq(uint256(pot.roundStatus()), uint256(SquidPot.RoundPhase.WAITING));
        _assertSolvent();

        vm.expectRevert(SquidPot.RoundIsWaiting.selector);
        pot.settleRound();
    }

    function testTimerTransitionsToSlowExtensionAndHardCap() public {
        piggy.transfer(alice, 25_000 ether);
        uint256 requestId = _play(alice);
        uint256 start = pot.roundStartedAt();
        uint256 hard = pot.hardDeadline();
        bool reachedSlowRegime;

        while (pot.deadline() < hard) {
            vm.warp(pot.deadline() - 1);
            vrf.fulfill(requestId, 0);
            requestId = _play(alice);

            uint256 timestamp = vm.getBlockTimestamp();
            uint256 expectedExtension = timestamp - start >= pot.ROUND_EXTENSION_CUTOFF()
                ? pot.ROUND_SLOW_EXTENSION()
                : pot.ROUND_FAST_EXTENSION();
            uint256 expectedDeadline = timestamp + expectedExtension;
            if (expectedDeadline > hard) expectedDeadline = hard;
            assertEq(pot.deadline(), expectedDeadline);
            assertLe(pot.deadline(), hard);
            if (timestamp - start >= pot.ROUND_EXTENSION_CUTOFF()) reachedSlowRegime = true;
        }

        assertTrue(reachedSlowRegime);
        assertEq(pot.deadline(), hard);
        vm.warp(hard);
        assertEq(uint256(pot.roundStatus()), uint256(SquidPot.RoundPhase.EXPIRED));

        vm.prank(bob);
        vm.expectRevert(SquidPot.RoundIsExpired.selector);
        pot.play();

        pot.settleRound();
        assertEq(pot.currentRoundId(), 2);
        assertEq(uint256(pot.roundStatus()), uint256(SquidPot.RoundPhase.WAITING));
    }

    function testPlayAtDeadlineReverts() public {
        _play(alice);
        vm.warp(pot.deadline());
        vm.prank(bob);
        vm.expectRevert(SquidPot.RoundIsExpired.selector);
        pot.play();
    }

    function testProbabilityBoundaries() public view {
        assertEq(pot.rewardForRoll(0), 0);
        assertEq(pot.rewardForRoll(7_999), 0);
        assertEq(pot.rewardForRoll(8_000), 10 ether);
        assertEq(pot.rewardForRoll(9_499), 10 ether);
        assertEq(pot.rewardForRoll(9_500), 20 ether);
        assertEq(pot.rewardForRoll(9_949), 20 ether);
        assertEq(pot.rewardForRoll(9_950), 50 ether);
        assertEq(pot.rewardForRoll(9_999), 50 ether);
    }

    function testPlayCreatesOfficialV25RequestFormat() public {
        uint256 requestId = _play(alice);
        (
            address consumer,
            bytes32 keyHash,
            uint256 subId,
            uint16 confirmations,
            uint32 callbackGasLimit,
            uint32 numWords,
            bytes32 extraArgsHash,
            bool exists
        ) = vrf.requests(requestId);

        assertEq(consumer, address(pot));
        assertEq(keyHash, VRF_KEY_HASH);
        assertEq(subId, VRF_SUBSCRIPTION_ID);
        assertEq(confirmations, VRF_REQUEST_CONFIRMATIONS);
        assertEq(callbackGasLimit, VRF_CALLBACK_GAS_LIMIT);
        assertEq(numWords, pot.NUM_WORDS());
        assertEq(
            extraArgsHash,
            keccak256(VRFV2PlusClient._argsToBytes(VRFV2PlusClient.ExtraArgsV1({ nativePayment: VRF_PAY_IN_NATIVE })))
        );
        assertTrue(exists);
    }

    function testUnauthorizedFulfillmentReverts() public {
        uint256 requestId = _play(alice);
        uint256[] memory words = new uint256[](1);
        words[0] = 8_000;

        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSelector(VRFConsumerBaseV2Plus.OnlyCoordinatorCanFulfill.selector, alice, address(vrf))
        );
        pot.rawFulfillRandomWords(requestId, words);

        assertEq(uint256(pot.getSlotRequest(requestId).status), uint256(SquidPot.SlotStatus.REQUESTED));
        assertEq(pot.activePendingRequests(), 1);
    }

    function testZeroRewardStillFulfills() public {
        uint256 requestId = _play(alice);
        vrf.fulfill(requestId, 7_999);
        SquidPot.SlotRequest memory request = pot.getSlotRequest(requestId);
        assertEq(uint256(request.status), uint256(SquidPot.SlotStatus.FULFILLED));
        assertEq(request.actualReward, 0);
        assertEq(pot.activePendingRequests(), 0);
        _assertSolvent();
    }

    function testSlotCapacityMaximumTenAndChecksBeforeTransfer() public {
        for (uint256 i = 0; i < pot.MAX_PENDING_REQUESTS(); i++) {
            _play(alice);
        }
        assertEq(pot.activePendingRequests(), 10);
        uint256 balanceBefore = piggy.balanceOf(alice);
        vm.prank(alice);
        vm.expectRevert(SquidPot.InsufficientSlotCapacity.selector);
        pot.play();
        assertEq(piggy.balanceOf(alice), balanceBefore);
    }

    function testRequestExpirationAndLateCallbackAreSafe() public {
        uint256 requestId = _play(alice);
        SquidPot.SlotRequest memory request = pot.getSlotRequest(requestId);
        vm.roll(uint256(request.requestedAtBlock) + pot.REQUEST_TIMEOUT_BLOCKS());
        pot.expireSlotRequest(requestId);
        uint256 liabilities = pot.totalLiabilities();
        vrf.fulfill(requestId, 9_950);
        request = pot.getSlotRequest(requestId);
        assertEq(uint256(request.status), uint256(SquidPot.SlotStatus.EXPIRED));
        assertEq(pot.totalLiabilities(), liabilities);
        assertEq(pot.activePendingRequests(), 0);
        _assertSolvent();
    }

    function testDuplicateAndUnknownCallbacksDoNotChangeAccounting() public {
        uint256 requestId = _play(alice);
        vrf.fulfill(requestId, 9_950);
        uint256 liabilities = pot.totalLiabilities();
        uint256 balance = pot.contractBalance();
        vrf.fulfill(requestId, 0);
        vrf.attemptUnknownCallback(address(pot), 987_654, 9_950);
        assertEq(pot.totalLiabilities(), liabilities);
        assertEq(pot.contractBalance(), balance);
        assertEq(pot.activePendingRequests(), 0);
    }

    function testSynchronousCallbackCannotCreateUntrackedReward() public {
        vrf.setSynchronousCallback(true, 8_000);
        uint256 requestId = _play(alice);

        SquidPot.SlotRequest memory request = pot.getSlotRequest(requestId);
        assertEq(uint256(request.status), uint256(SquidPot.SlotStatus.REQUESTED));
        assertEq(request.actualReward, 0);
        assertEq(pot.pendingSlotRewards(alice), 0);
        assertEq(pot.activePendingRequests(), 1);
        assertEq(pot.reservedSlotLiability(), pot.R_MAX());
        _assertSolvent();

        vrf.setSynchronousCallback(false, 0);
        vrf.fulfill(requestId, 8_000);
        request = pot.getSlotRequest(requestId);
        assertEq(uint256(request.status), uint256(SquidPot.SlotStatus.FULFILLED));
        assertEq(request.actualReward, 10 ether);
        assertEq(pot.pendingSlotRewards(alice), 10 ether);
        assertEq(pot.activePendingRequests(), 0);
        _assertSolvent();
    }

    function testDuplicateRequestIdsCannotOverwrite() public {
        uint256 requestId = _play(alice);
        vrf.setNextRequestId(requestId);
        vm.prank(bob);
        vm.expectRevert(abi.encodeWithSelector(SquidPot.DuplicateRequestId.selector, requestId));
        pot.play();
        assertEq(pot.activePendingRequests(), 1);
        SquidPot.SlotRequest memory request = pot.getSlotRequest(requestId);
        assertEq(request.player, alice);
        _assertSolvent();
    }

    function testClaimsArePullPaymentsAndDoubleClaimReverts() public {
        uint256 requestId = _play(alice);
        vrf.fulfill(requestId, 8_000);
        uint256 before = piggy.balanceOf(alice);
        vm.prank(alice);
        pot.claimSlotRewards();
        assertEq(piggy.balanceOf(alice), before + 10 ether);
        assertEq(pot.pendingSlotRewards(alice), 0);
        vm.prank(alice);
        vm.expectRevert(SquidPot.NotClaimable.selector);
        pot.claimSlotRewards();
    }

    function testClaimEventUsesClaimRoundId() public {
        uint256 first = _play(alice);
        vrf.fulfill(first, 0);
        _play(bob);

        vm.warp(pot.deadline());
        pot.settleRound();
        uint256 prize = pot.pendingPrizes(bob);

        vm.expectEmit(true, true, true, true, address(pot));
        emit SquidPot.Claimed(bob, pot.currentRoundId(), bytes32("PRIZE"), prize);
        vm.prank(bob);
        pot.claimPrize();
    }

    function testPrizeAndPreviousClaimsClearAggregates() public {
        uint256 first = _play(alice);
        vrf.fulfill(first, 0);
        _play(bob);
        vm.prank(alice);
        pot.claimPreviousRewards();
        assertEq(pot.totalPendingPreviousRewards(), 0);

        vm.warp(pot.deadline());
        pot.settleRound();
        uint256 prize = pot.pendingPrizes(bob);
        vm.prank(bob);
        pot.claimPrize();
        assertEq(pot.pendingPrizes(bob), 0);
        assertEq(pot.totalPendingPrizes(), 0);
        assertEq(piggy.balanceOf(bob), 1_000 ether - 10 ether + prize);
    }

    function testPauseBlocksOnlyPlay() public {
        uint256 requestId = _play(alice);
        uint256 expiringRequestId = _play(bob);
        pot.pause();
        vm.prank(bob);
        vm.expectRevert();
        pot.play();

        // Fulfillment and claims remain live while paused.
        vrf.fulfill(requestId, 8_000);
        vm.prank(alice);
        pot.claimSlotRewards();

        SquidPot.SlotRequest memory expiring = pot.getSlotRequest(expiringRequestId);
        vm.roll(uint256(expiring.requestedAtBlock) + pot.REQUEST_TIMEOUT_BLOCKS());
        pot.expireSlotRequest(expiringRequestId);

        // Settlement also remains live while paused.
        vm.warp(pot.deadline());
        pot.settleRound();
        pot.unpause();
    }

    function testDonationCreatesAccountingSurplusOnly() public {
        uint256 liabilities = pot.totalLiabilities();
        piggy.transfer(address(pot), 123 ether);
        assertEq(pot.totalLiabilities(), liabilities);
        assertEq(pot.accountingSurplus(), 123 ether);
        _assertSolvent();
    }

    function test_RevertWhen_BurnTransferFailsRollsBackAllPlayState() public {
        MockFailingBurnToken burnToken = new MockFailingBurnToken();
        MockVRFCoordinator burnVrf = new MockVRFCoordinator();
        SquidPot burnPot = _newSquidPot(IERC20(address(burnToken)), burnVrf, treasury);
        burnToken.transfer(treasury, burnPot.INITIAL_FUNDING());
        burnToken.transfer(alice, 100 ether);
        vm.startPrank(treasury);
        burnToken.approve(address(burnPot), type(uint256).max);
        burnPot.initializeFunding();
        vm.stopPrank();
        vm.prank(alice);
        burnToken.approve(address(burnPot), type(uint256).max);
        burnToken.setFailBurn(true);

        uint256 balanceBefore = burnToken.balanceOf(alice);
        uint256 liabilitiesBefore = burnPot.totalLiabilities();
        vm.prank(alice);
        vm.expectRevert();
        burnPot.play();
        assertEq(burnToken.balanceOf(alice), balanceBefore);
        assertEq(burnPot.totalLiabilities(), liabilitiesBefore);
        assertEq(burnPot.activePendingRequests(), 0);
    }

    function test_RevertWhen_VRFRequestFailsRollsBackEntryBurnAndAccounting() public {
        vrf.setFailNextRequest(true);
        uint256 aliceBefore = piggy.balanceOf(alice);
        uint256 contractBefore = pot.contractBalance();
        uint256 liabilitiesBefore = pot.totalLiabilities();
        vm.prank(alice);
        vm.expectRevert("mock VRF request failed");
        pot.play();
        assertEq(piggy.balanceOf(alice), aliceBefore);
        assertEq(pot.contractBalance(), contractBefore);
        assertEq(pot.totalLiabilities(), liabilitiesBefore);
        assertEq(pot.activePendingRequests(), 0);
        assertEq(pot.roundStartedAt(), 0);
    }

    function testVRFFailureCanBeClearedAndFollowedBySuccessfulPlayAndFulfillment() public {
        vrf.setFailNextRequest(true);
        uint256 aliceBefore = piggy.balanceOf(alice);
        uint256 contractBefore = pot.contractBalance();
        uint256 deadBefore = piggy.balanceOf(pot.DEAD_ADDRESS());
        uint256 liabilitiesBefore = pot.totalLiabilities();

        vm.prank(alice);
        vm.expectRevert("mock VRF request failed");
        pot.play();

        assertEq(piggy.balanceOf(alice), aliceBefore);
        assertEq(pot.contractBalance(), contractBefore);
        assertEq(piggy.balanceOf(pot.DEAD_ADDRESS()), deadBefore);
        assertEq(pot.totalLiabilities(), liabilitiesBefore);
        assertEq(pot.activePendingRequests(), 0);
        assertEq(pot.roundStartedAt(), 0);
        assertTrue(vrf.failNextRequest(), "reverted mock call must leave the armed failure set");

        vrf.setFailNextRequest(false);
        assertFalse(vrf.failNextRequest());

        uint256 requestId = _play(alice);
        assertEq(requestId, 1);
        assertEq(uint256(pot.getSlotRequest(requestId).status), uint256(SquidPot.SlotStatus.REQUESTED));
        assertEq(pot.activePendingRequests(), 1);

        vrf.fulfill(requestId, 8_000);
        assertEq(uint256(pot.getSlotRequest(requestId).status), uint256(SquidPot.SlotStatus.FULFILLED));
        assertEq(pot.pendingSlotRewards(alice), 10 ether);
        assertEq(pot.activePendingRequests(), 0);
        _assertSolvent();
    }

    function testRequestWithNoRandomWordsDoesNotCorruptRequestedState() public {
        uint256 requestId = _play(alice);
        vrf.fulfillWithoutWords(requestId);
        assertEq(uint256(pot.getSlotRequest(requestId).status), uint256(SquidPot.SlotStatus.REQUESTED));
        assertEq(pot.activePendingRequests(), 1);
        _assertSolvent();
    }

    function testSafeNarrowingCastsRejectOutOfRangeValues() public {
        vm.expectRevert();
        castHarness.toUint96(uint256(type(uint96).max) + 1);

        vm.expectRevert();
        castHarness.toUint64(uint256(type(uint64).max) + 1);

        assertEq(castHarness.toUint96(pot.R_MAX()), uint96(pot.R_MAX()));
        assertEq(castHarness.toUint96(pot.rewardForRoll(9_999)), uint96(50 ether));
        assertEq(castHarness.toUint64(block.number), uint64(block.number));
        assertEq(castHarness.toUint64(pot.currentRoundId()), uint64(pot.currentRoundId()));
    }
}
