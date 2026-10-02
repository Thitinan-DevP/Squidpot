// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { StdInvariant } from "forge-std/StdInvariant.sol";
import { Test } from "forge-std/Test.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { PiggyToken } from "../src/PiggyToken.sol";
import { SquidPot } from "../src/SquidPot.sol";
import { MockVRFCoordinator } from "./mocks/MockVRFCoordinator.sol";
import { MockFailingBurnToken } from "./mocks/MockFailingBurnToken.sol";

contract SquidPotInvariantPlayer {
    IERC20 public immutable token;
    SquidPot public immutable pot;

    constructor(
        IERC20 token_,
        SquidPot pot_
    ) {
        token = token_;
        pot = pot_;
        token_.approve(address(pot_), type(uint256).max);
    }

    function play() external returns (uint256) {
        return pot.play();
    }

    function claimSlotRewards() external {
        pot.claimSlotRewards();
    }

    function claimPreviousRewards() external {
        pot.claimPreviousRewards();
    }

    function claimPrize() external {
        pot.claimPrize();
    }
}

contract SquidPotInvariantHandler is Test {
    uint256 internal constant VRF_SUBSCRIPTION_ID = 1;
    bytes32 internal constant VRF_KEY_HASH = keccak256("local-vrf-key-hash");
    uint32 internal constant VRF_CALLBACK_GAS_LIMIT = 500_000;
    uint16 internal constant VRF_REQUEST_CONFIRMATIONS = 3;

    uint8 internal constant MODEL_REQUESTED = 1;
    uint8 internal constant MODEL_FULFILLED = 2;
    uint8 internal constant MODEL_EXPIRED = 3;

    struct ModelSlotRequest {
        address player;
        uint256 maxReserved;
        uint256 actualReward;
        uint256 requestedAtBlock;
        uint256 roundId;
        uint8 status;
    }

    PiggyToken public immutable token;
    SquidPot public immutable pot;
    MockVRFCoordinator public immutable vrf;
    SquidPotInvariantPlayer public immutable playerA;
    SquidPotInvariantPlayer public immutable playerB;

    MockFailingBurnToken public immutable failureToken;
    MockVRFCoordinator public immutable failureVrf;
    SquidPot public immutable failurePot;

    uint256[] public requestIds;
    uint256 public requestCount;
    mapping(uint256 => ModelSlotRequest) public modelRequests;

    uint256 public modelCurrentPrizePool;
    uint256 public modelAvailableSlotReserve;
    uint256 public modelReservedSlotLiability;
    uint256 public modelTotalPendingSlotRewards;
    uint256 public modelTotalPendingPreviousRewards;
    uint256 public modelRolloverReserve;
    uint256 public modelTotalPendingPrizes;
    mapping(address => uint256) public modelPendingSlotRewards;
    mapping(address => uint256) public modelPendingPreviousRewards;
    mapping(address => uint256) public modelPendingPrizes;
    uint256 public modelActivePendingRequests;
    uint256 public modelCurrentRoundId;
    uint256 public modelRoundStartedAt;
    uint256 public modelDeadline;
    uint256 public modelHardDeadline;
    address public modelLastPlayer;
    uint256 public modelNumberOfPlays;
    bool public modelPaused;

    constructor(
        PiggyToken token_,
        SquidPot pot_,
        MockVRFCoordinator vrf_
    ) {
        token = token_;
        pot = pot_;
        vrf = vrf_;
        token_.approve(address(pot_), type(uint256).max);

        playerA = new SquidPotInvariantPlayer(token_, pot_);
        playerB = new SquidPotInvariantPlayer(token_, pot_);

        failureToken = new MockFailingBurnToken();
        failureVrf = new MockVRFCoordinator();
        failurePot = new SquidPot(
            IERC20(address(failureToken)),
            address(failureVrf),
            address(this),
            VRF_SUBSCRIPTION_ID,
            VRF_KEY_HASH,
            VRF_CALLBACK_GAS_LIMIT,
            VRF_REQUEST_CONFIRMATIONS,
            true
        );
        failureToken.approve(address(failurePot), type(uint256).max);
        failurePot.initializeFunding();

        modelCurrentPrizePool = pot_.GENESIS_PRIZE_POOL();
        modelAvailableSlotReserve = pot_.INITIAL_SLOT_SEED();
        modelCurrentRoundId = 1;
    }

    function acceptPotOwnership() external {
        pot.acceptOwnership();
    }

    function play(
        uint256 choice
    ) external {
        SquidPotInvariantPlayer player = choice % 2 == 0 ? playerA : playerB;
        try player.play() returns (uint256 requestId) {
            _recordPlay(address(player), requestId);
        } catch { }
        _assertModel();
    }

    function fulfillFirstPending(
        uint256 randomWord
    ) external {
        for (uint256 i = 0; i < requestIds.length; i++) {
            if (modelRequests[requestIds[i]].status == MODEL_REQUESTED) {
                try vrf.fulfill(requestIds[i], randomWord) {
                    _recordFulfillment(requestIds[i], randomWord);
                } catch { }
                break;
            }
        }
        _assertModel();
    }

    function expireFirstPending() external {
        for (uint256 i = 0; i < requestIds.length; i++) {
            uint256 requestId = requestIds[i];
            ModelSlotRequest memory request = modelRequests[requestId];
            if (request.status == MODEL_REQUESTED) {
                if (block.number < request.requestedAtBlock + pot.REQUEST_TIMEOUT_BLOCKS()) {
                    vm.roll(request.requestedAtBlock + pot.REQUEST_TIMEOUT_BLOCKS());
                }
                try pot.expireSlotRequest(requestId) {
                    _recordExpiration(requestId);
                } catch { }

                try vrf.fulfill(requestId, 9_950) { } catch { }
                break;
            }
        }
        _assertModel();
    }

    function duplicateCallback() external {
        for (uint256 i = 0; i < requestIds.length; i++) {
            uint256 requestId = requestIds[i];
            uint8 status = modelRequests[requestId].status;
            if (status == MODEL_FULFILLED || status == MODEL_EXPIRED) {
                try vrf.fulfill(requestId, 9_950) { } catch { }
                break;
            }
        }
        _assertModel();
    }

    function unknownCallback() external {
        try vrf.attemptUnknownCallback(address(pot), type(uint256).max, 9_950) { } catch { }
        _assertModel();
    }

    function settleRound() external {
        if (modelRoundStartedAt != 0 && block.timestamp < modelDeadline) vm.warp(modelDeadline);
        try pot.settleRound() {
            _recordSettlement();
        } catch { }
        _assertModel();
    }

    function claimSlot(
        uint256 choice
    ) external {
        SquidPotInvariantPlayer player = choice % 2 == 0 ? playerA : playerB;
        uint256 amount = modelPendingSlotRewards[address(player)];
        try player.claimSlotRewards() {
            if (amount != 0) {
                modelPendingSlotRewards[address(player)] = 0;
                modelTotalPendingSlotRewards -= amount;
            }
        } catch { }
        _assertModel();
    }

    function claimPrevious(
        uint256 choice
    ) external {
        SquidPotInvariantPlayer player = choice % 2 == 0 ? playerA : playerB;
        uint256 amount = modelPendingPreviousRewards[address(player)];
        try player.claimPreviousRewards() {
            if (amount != 0) {
                modelPendingPreviousRewards[address(player)] = 0;
                modelTotalPendingPreviousRewards -= amount;
            }
        } catch { }
        _assertModel();
    }

    function claimPrize(
        uint256 choice
    ) external {
        SquidPotInvariantPlayer player = choice % 2 == 0 ? playerA : playerB;
        uint256 amount = modelPendingPrizes[address(player)];
        try player.claimPrize() {
            if (amount != 0) {
                modelPendingPrizes[address(player)] = 0;
                modelTotalPendingPrizes -= amount;
            }
        } catch { }
        _assertModel();
    }

    function pauseOrUnpause(
        bool shouldPause
    ) external {
        if (shouldPause && !modelPaused) {
            try pot.pause() {
                modelPaused = true;
            } catch { }
        } else if (!shouldPause && modelPaused) {
            try pot.unpause() {
                modelPaused = false;
            } catch { }
        }
        _assertModel();
    }

    function donate(
        uint256 amount
    ) external {
        amount %= 100 ether;
        try token.transfer(address(pot), amount) { } catch { }
        _assertModel();
    }

    function failedBurn() external {
        failureToken.setFailBurn(true);
        bool succeeded;
        try failurePot.play() returns (uint256) {
            succeeded = true;
        } catch { }
        failureToken.setFailBurn(false);
        assertFalse(succeeded, "failed burn unexpectedly succeeded");
        assertEq(failurePot.currentRoundId(), 1);
        assertEq(failurePot.roundStartedAt(), 0);
        assertEq(failurePot.activePendingRequests(), 0);
        assertEq(failurePot.contractBalance(), failurePot.INITIAL_FUNDING());
        _assertModel();
    }

    function failedVRFRequest(
        uint256 choice
    ) external {
        if (modelPaused) {
            pot.unpause();
            modelPaused = false;
        }
        if (modelRoundStartedAt != 0 && block.timestamp >= modelDeadline) {
            _assertModel();
            return;
        }
        if (modelAvailableSlotReserve < pot.R_MAX() || modelActivePendingRequests >= pot.MAX_PENDING_REQUESTS()) {
            _assertModel();
            return;
        }

        vrf.setFailNextRequest(true);
        SquidPotInvariantPlayer player = choice % 2 == 0 ? playerA : playerB;
        bool succeeded;
        try player.play() returns (uint256) {
            succeeded = true;
        } catch {
            // The mock's internal reset is reverted with the failed coordinator call.
            // Clear its armed failure from this handler transaction before later actions.
            vrf.setFailNextRequest(false);
        }
        assertFalse(succeeded, "failed VRF request unexpectedly succeeded");
        _assertModel();
    }

    function advanceTime(
        uint256 delta
    ) external {
        if (modelRoundStartedAt == 0) {
            vm.warp(block.timestamp + delta % 2 days);
        } else {
            uint256 offset = delta % (pot.ROUND_HARD_DURATION() + 1);
            uint256 target = modelRoundStartedAt + offset;
            if (target < block.timestamp) target = block.timestamp;
            vm.warp(target);
        }
        _assertModel();
    }

    function assertModelMatches() external view {
        _assertModel();
    }

    function _recordPlay(
        address player,
        uint256 requestId
    ) internal {
        if (modelRoundStartedAt == 0) {
            modelRoundStartedAt = block.timestamp;
            modelHardDeadline = block.timestamp + pot.ROUND_HARD_DURATION();
            modelDeadline = block.timestamp + pot.ROUND_FAST_EXTENSION();
        } else {
            uint256 elapsed = block.timestamp - modelRoundStartedAt;
            uint256 extension =
                elapsed < pot.ROUND_EXTENSION_CUTOFF() ? pot.ROUND_FAST_EXTENSION() : pot.ROUND_SLOW_EXTENSION();
            uint256 proposedDeadline = block.timestamp + extension;
            modelDeadline = proposedDeadline < modelHardDeadline ? proposedDeadline : modelHardDeadline;
        }

        modelCurrentPrizePool += pot.CURRENT_PRIZE_ALLOCATION();
        modelAvailableSlotReserve += pot.SLOT_ALLOCATION();
        modelRolloverReserve += pot.ROLLOVER_ALLOCATION();
        if (modelLastPlayer == address(0) || modelLastPlayer == player) {
            modelRolloverReserve += pot.PREVIOUS_PLAYER_ALLOCATION();
        } else {
            modelPendingPreviousRewards[modelLastPlayer] += pot.PREVIOUS_PLAYER_ALLOCATION();
            modelTotalPendingPreviousRewards += pot.PREVIOUS_PLAYER_ALLOCATION();
        }
        modelLastPlayer = player;
        modelNumberOfPlays++;

        modelRequests[requestId] = ModelSlotRequest({
            player: player,
            maxReserved: pot.R_MAX(),
            actualReward: 0,
            requestedAtBlock: block.number,
            roundId: modelCurrentRoundId,
            status: MODEL_REQUESTED
        });
        requestIds.push(requestId);
        requestCount++;
        modelAvailableSlotReserve -= pot.R_MAX();
        modelReservedSlotLiability += pot.R_MAX();
        modelActivePendingRequests++;
    }

    function _recordFulfillment(
        uint256 requestId,
        uint256 randomWord
    ) internal {
        ModelSlotRequest storage request = modelRequests[requestId];
        uint256 reward = _modelReward(randomWord % 10_000);
        request.actualReward = reward;
        request.status = MODEL_FULFILLED;
        modelReservedSlotLiability -= pot.R_MAX();
        modelAvailableSlotReserve += pot.R_MAX() - reward;
        modelTotalPendingSlotRewards += reward;
        modelPendingSlotRewards[request.player] += reward;
        modelActivePendingRequests--;
    }

    function _recordExpiration(
        uint256 requestId
    ) internal {
        ModelSlotRequest storage request = modelRequests[requestId];
        request.status = MODEL_EXPIRED;
        modelReservedSlotLiability -= pot.R_MAX();
        modelAvailableSlotReserve += pot.R_MAX();
        modelActivePendingRequests--;
    }

    function _recordSettlement() internal {
        uint256 prize = modelCurrentPrizePool;
        uint256 rollover = modelRolloverReserve;
        address winner = modelLastPlayer;
        modelCurrentPrizePool = 0;
        modelPendingPrizes[winner] += prize;
        modelTotalPendingPrizes += prize;
        modelCurrentPrizePool = rollover;
        modelRolloverReserve = 0;
        modelCurrentRoundId++;
        modelRoundStartedAt = 0;
        modelDeadline = 0;
        modelHardDeadline = 0;
        modelLastPlayer = address(0);
        modelNumberOfPlays = 0;
    }

    function _modelReward(
        uint256 roll
    ) internal pure returns (uint256) {
        if (roll < 8_000) return 0;
        if (roll < 9_500) return 10 ether;
        if (roll < 9_950) return 20 ether;
        return 50 ether;
    }

    function _assertModel() internal view {
        assertEq(pot.currentPrizePool(), modelCurrentPrizePool, "currentPrizePool model mismatch");
        assertEq(pot.availableSlotReserve(), modelAvailableSlotReserve, "available reserve model mismatch");
        assertEq(pot.reservedSlotLiability(), modelReservedSlotLiability, "reserved liability model mismatch");
        assertEq(pot.totalPendingSlotRewards(), modelTotalPendingSlotRewards, "slot rewards model mismatch");
        assertEq(pot.totalPendingPreviousRewards(), modelTotalPendingPreviousRewards, "previous rewards model mismatch");
        assertEq(pot.rolloverReserve(), modelRolloverReserve, "rollover model mismatch");
        assertEq(pot.totalPendingPrizes(), modelTotalPendingPrizes, "prize liabilities model mismatch");
        assertEq(pot.activePendingRequests(), modelActivePendingRequests, "active request model mismatch");
        assertEq(pot.currentRoundId(), modelCurrentRoundId, "round ID model mismatch");
        assertEq(pot.roundStartedAt(), modelRoundStartedAt, "round start model mismatch");
        assertEq(pot.deadline(), modelDeadline, "deadline model mismatch");
        assertEq(pot.hardDeadline(), modelHardDeadline, "hard deadline model mismatch");
        assertEq(pot.lastPlayer(), modelLastPlayer, "last player model mismatch");
        assertEq(pot.numberOfPlays(), modelNumberOfPlays, "play count model mismatch");
        assertEq(pot.paused(), modelPaused, "pause model mismatch");
        assertEq(pot.pendingSlotRewards(address(playerA)), modelPendingSlotRewards[address(playerA)]);
        assertEq(pot.pendingSlotRewards(address(playerB)), modelPendingSlotRewards[address(playerB)]);
        assertEq(pot.pendingPreviousRewards(address(playerA)), modelPendingPreviousRewards[address(playerA)]);
        assertEq(pot.pendingPreviousRewards(address(playerB)), modelPendingPreviousRewards[address(playerB)]);
        assertEq(pot.pendingPrizes(address(playerA)), modelPendingPrizes[address(playerA)]);
        assertEq(pot.pendingPrizes(address(playerB)), modelPendingPrizes[address(playerB)]);

        uint256 expectedLiabilities = modelCurrentPrizePool + modelAvailableSlotReserve + modelReservedSlotLiability
            + modelTotalPendingSlotRewards + modelTotalPendingPreviousRewards + modelRolloverReserve
            + modelTotalPendingPrizes;
        assertGe(pot.contractBalance(), expectedLiabilities, "independent model insolvency");

        for (uint256 i = 0; i < requestIds.length; i++) {
            uint256 requestId = requestIds[i];
            SquidPot.SlotRequest memory actual = pot.getSlotRequest(requestId);
            ModelSlotRequest memory expected = modelRequests[requestId];
            assertEq(actual.player, expected.player, "request player model mismatch");
            assertEq(uint256(actual.maxReserved), expected.maxReserved, "request max model mismatch");
            assertEq(uint256(actual.actualReward), expected.actualReward, "request reward model mismatch");
            assertEq(uint256(actual.requestedAtBlock), expected.requestedAtBlock, "request block model mismatch");
            assertEq(uint256(actual.roundId), expected.roundId, "request round model mismatch");
            assertEq(uint256(actual.status), uint256(expected.status), "request status model mismatch");
        }
    }
}

contract SquidPotInvariantTest is StdInvariant, Test {
    uint256 internal constant VRF_SUBSCRIPTION_ID = 1;
    bytes32 internal constant VRF_KEY_HASH = keccak256("local-vrf-key-hash");
    uint32 internal constant VRF_CALLBACK_GAS_LIMIT = 500_000;
    uint16 internal constant VRF_REQUEST_CONFIRMATIONS = 3;

    PiggyToken internal piggy;
    MockVRFCoordinator internal vrf;
    SquidPot internal pot;
    SquidPotInvariantHandler internal handler;
    address internal treasury = makeAddr("invariant-treasury");

    function setUp() public {
        piggy = new PiggyToken();
        vrf = new MockVRFCoordinator();
        pot = new SquidPot(
            IERC20(address(piggy)),
            address(vrf),
            treasury,
            VRF_SUBSCRIPTION_ID,
            VRF_KEY_HASH,
            VRF_CALLBACK_GAS_LIMIT,
            VRF_REQUEST_CONFIRMATIONS,
            true
        );
        piggy.transfer(treasury, pot.INITIAL_FUNDING());
        vm.startPrank(treasury);
        piggy.approve(address(pot), pot.INITIAL_FUNDING());
        pot.initializeFunding();
        vm.stopPrank();

        handler = new SquidPotInvariantHandler(piggy, pot, vrf);
        piggy.transfer(address(handler), 10_000_000 ether);
        piggy.transfer(address(handler.playerA()), 2_000_000 ether);
        piggy.transfer(address(handler.playerB()), 2_000_000 ether);
        pot.transferOwnership(address(handler));
        handler.acceptPotOwnership();

        bytes4[] memory selectors = new bytes4[](14);
        selectors[0] = handler.play.selector;
        selectors[1] = handler.fulfillFirstPending.selector;
        selectors[2] = handler.expireFirstPending.selector;
        selectors[3] = handler.duplicateCallback.selector;
        selectors[4] = handler.unknownCallback.selector;
        selectors[5] = handler.settleRound.selector;
        selectors[6] = handler.claimSlot.selector;
        selectors[7] = handler.claimPrevious.selector;
        selectors[8] = handler.claimPrize.selector;
        selectors[9] = handler.pauseOrUnpause.selector;
        selectors[10] = handler.donate.selector;
        selectors[11] = handler.failedBurn.selector;
        selectors[12] = handler.failedVRFRequest.selector;
        selectors[13] = handler.advanceTime.selector;
        targetContract(address(handler));
        targetSelector(FuzzSelector({ addr: address(handler), selectors: selectors }));
    }

    function invariant_balanceAlwaysCoversLiabilities() public view {
        assertGe(pot.contractBalance(), pot.totalLiabilities());
        assertEq(pot.contractBalance() - pot.totalLiabilities(), pot.accountingSurplus());
    }

    function invariant_independentModelMatchesContract() public view {
        handler.assertModelMatches();
    }

    function invariant_activePendingRequestsMatchesRequested() public view {
        uint256 requested;
        for (uint256 i = 0; i < handler.requestCount(); i++) {
            SquidPot.SlotRequest memory request = pot.getSlotRequest(handler.requestIds(i));
            if (request.status == SquidPot.SlotStatus.REQUESTED) requested++;
        }
        assertEq(pot.activePendingRequests(), requested);
    }
}
