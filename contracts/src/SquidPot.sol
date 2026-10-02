// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { Pausable } from "@openzeppelin/contracts/utils/Pausable.sol";
import { SafeCast } from "@openzeppelin/contracts/utils/math/SafeCast.sol";
import { VRFConsumerBaseV2Plus } from "@chainlink/contracts/src/v0.8/vrf/dev/VRFConsumerBaseV2Plus.sol";
import { VRFV2PlusClient } from "@chainlink/contracts/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";

contract SquidPot is ReentrancyGuard, Pausable, VRFConsumerBaseV2Plus {
    using SafeERC20 for IERC20;
    using SafeCast for uint256;

    uint256 public constant ENTRY_FEE = 10 ether;
    uint256 public constant CURRENT_PRIZE_ALLOCATION = 4 ether;
    uint256 public constant SLOT_ALLOCATION = 3 ether;
    uint256 public constant PREVIOUS_PLAYER_ALLOCATION = 1.5 ether;
    uint256 public constant ROLLOVER_ALLOCATION = 1 ether;
    uint256 public constant BURN_ALLOCATION = 0.5 ether;
    uint256 public constant GENESIS_PRIZE_POOL = 100_000 ether;
    uint256 public constant INITIAL_SLOT_SEED = 500 ether;
    uint256 public constant INITIAL_FUNDING = GENESIS_PRIZE_POOL + INITIAL_SLOT_SEED;

    uint256 public constant R_MAX = 50 ether;
    uint256 public constant MAX_PENDING_REQUESTS = 10;
    uint256 public constant REQUEST_TIMEOUT_BLOCKS = 200;
    uint32 public constant NUM_WORDS = 1;

    uint256 public constant ROUND_HARD_DURATION = 24 hours;
    uint256 public constant ROUND_FAST_EXTENSION = 3 minutes;
    uint256 public constant ROUND_SLOW_EXTENSION = 30 seconds;
    uint256 public constant ROUND_EXTENSION_CUTOFF = 12 hours;

    address public constant DEAD_ADDRESS = address(0x000000000000000000000000000000000000dEaD);
    bytes32 private constant CALLBACK_REASON_LATE = "LATE";
    bytes32 private constant CALLBACK_REASON_DURING_REQUEST = "CALLBACK_DURING_REQUEST";
    bytes32 private constant CALLBACK_REASON_DUPLICATE_OR_UNKNOWN = "DUPLICATE_OR_UNKNOWN";
    bytes32 private constant CALLBACK_REASON_NO_RANDOM_WORD = "NO_RANDOM_WORD";
    bytes32 private constant CLAIM_KIND_SLOT = "SLOT";
    bytes32 private constant CLAIM_KIND_PREVIOUS = "PREVIOUS";
    bytes32 private constant CLAIM_KIND_PRIZE = "PRIZE";

    enum RoundPhase {
        WAITING,
        OPEN,
        EXPIRED
    }

    enum SlotStatus {
        NONE,
        REQUESTED,
        FULFILLED,
        EXPIRED
    }

    struct SlotRequest {
        address player;
        uint96 maxReserved;
        uint96 actualReward;
        uint64 requestedAtBlock;
        uint64 roundId;
        SlotStatus status;
    }

    IERC20 public immutable piggy;
    address public immutable academicTreasury;
    uint256 public immutable vrfSubscriptionId;
    bytes32 public immutable vrfKeyHash;
    uint32 public immutable vrfCallbackGasLimit;
    uint16 public immutable vrfRequestConfirmations;
    bool public immutable vrfPayInNative;

    bool public fundingInitialized;
    uint256 public currentRoundId = 1;

    // The seven liabilities are intentionally explicit. Do not add a generic slotReserve.
    uint256 public currentPrizePool;
    uint256 public availableSlotReserve;
    uint256 public reservedSlotLiability;
    uint256 public totalPendingSlotRewards;
    uint256 public totalPendingPreviousRewards;
    uint256 public rolloverReserve;
    uint256 public totalPendingPrizes;

    mapping(address => uint256) public pendingSlotRewards;
    mapping(address => uint256) public pendingPreviousRewards;
    mapping(address => uint256) public pendingPrizes;
    mapping(uint256 => SlotRequest) public slotRequests;

    uint256 public activePendingRequests;
    uint256 public roundStartedAt;
    uint256 public deadline;
    uint256 public hardDeadline;
    address public lastPlayer;
    uint256 public numberOfPlays;

    error AlreadyInitialized();
    error NotAcademicTreasury();
    error ExactFundingRequired(uint256 expected, uint256 received);
    error NotInitialized();
    error RoundIsExpired();
    error RoundIsWaiting();
    error DeadlineReached();
    error InsufficientSlotCapacity();
    error DuplicateRequestId(uint256 requestId);
    error NotClaimable();
    error RequestNotFound();
    error RequestNotExpired();
    error InvalidCallback();
    error RolloverInvariantBroken();
    error EmptyExpiredRound();
    error InvalidVrfConfiguration();

    bool private requestCreationInProgress;

    event FundingInitialized(
        address indexed funder,
        uint256 indexed roundId,
        uint256 genesisPrizePool,
        uint256 initialSlotSeed,
        uint256 received
    );
    event Played(
        address indexed player,
        uint256 indexed roundId,
        uint256 indexed requestId,
        uint256 entryFee,
        uint256 prizeAllocation,
        uint256 slotAllocation,
        uint256 previousAllocation,
        uint256 rolloverAllocation,
        uint256 burned
    );
    event SlotRequestCreated(
        uint256 indexed requestId,
        address indexed player,
        uint256 indexed roundId,
        uint256 maxReserved,
        uint256 requestedAtBlock
    );
    event SlotRequestFulfilled(
        uint256 indexed requestId, address indexed player, uint256 indexed roundId, uint256 randomWord, uint256 reward
    );
    event SlotRequestExpired(uint256 indexed requestId, address indexed player, uint256 indexed roundId);
    event SlotCallbackIgnored(uint256 indexed requestId, uint256 indexed roundId, SlotStatus status, bytes32 reason);
    event SlotCallbackInvalid(uint256 indexed requestId, uint256 indexed roundId, bytes32 reason);
    event RoundSettled(
        uint256 indexed roundId,
        address indexed winner,
        uint256 prize,
        uint256 startedAt,
        uint256 deadline,
        uint256 settledAt,
        uint256 plays,
        uint256 rolloverForNextRound
    );
    event Claimed(address indexed account, uint256 indexed claimRoundId, bytes32 indexed kind, uint256 amount);

    constructor(
        IERC20 piggyToken,
        address coordinator,
        address treasury,
        uint256 subscriptionId,
        bytes32 keyHash,
        uint32 callbackGasLimit,
        uint16 requestConfirmations,
        bool payInNative
    ) VRFConsumerBaseV2Plus(coordinator) {
        require(address(piggyToken) != address(0), "token=0");
        require(treasury != address(0), "treasury=0");
        if (subscriptionId == 0 || keyHash == bytes32(0) || callbackGasLimit == 0 || requestConfirmations == 0) {
            revert InvalidVrfConfiguration();
        }
        piggy = piggyToken;
        academicTreasury = treasury;
        vrfSubscriptionId = subscriptionId;
        vrfKeyHash = keyHash;
        vrfCallbackGasLimit = callbackGasLimit;
        vrfRequestConfirmations = requestConfirmations;
        vrfPayInNative = payInNative;
    }

    function initializeFunding() external nonReentrant {
        if (fundingInitialized) revert AlreadyInitialized();
        if (msg.sender != academicTreasury) revert NotAcademicTreasury();

        uint256 beforeBalance = piggy.balanceOf(address(this));
        piggy.safeTransferFrom(msg.sender, address(this), INITIAL_FUNDING);
        uint256 afterBalance = piggy.balanceOf(address(this));
        uint256 received = afterBalance - beforeBalance;
        if (received != INITIAL_FUNDING) revert ExactFundingRequired(INITIAL_FUNDING, received);

        // Accounting is updated only after the exact receipt has been verified.
        currentPrizePool = GENESIS_PRIZE_POOL;
        availableSlotReserve = INITIAL_SLOT_SEED;
        fundingInitialized = true;

        emit FundingInitialized(msg.sender, currentRoundId, GENESIS_PRIZE_POOL, INITIAL_SLOT_SEED, received);
    }

    function play() external nonReentrant whenNotPaused returns (uint256 requestId) {
        if (!fundingInitialized) revert NotInitialized();
        RoundPhase phase = roundStatus();
        if (phase == RoundPhase.EXPIRED) revert RoundIsExpired();
        if (phase == RoundPhase.OPEN && block.timestamp >= deadline) revert DeadlineReached();
        if (availableSlotReserve < R_MAX || activePendingRequests >= MAX_PENDING_REQUESTS) {
            revert InsufficientSlotCapacity();
        }

        _advanceRoundTimer();

        uint256 playerBalanceBefore = piggy.balanceOf(msg.sender);
        uint256 contractBalanceBefore = piggy.balanceOf(address(this));
        piggy.safeTransferFrom(msg.sender, address(this), ENTRY_FEE);
        uint256 contractBalanceAfter = piggy.balanceOf(address(this));
        if (contractBalanceAfter - contractBalanceBefore != ENTRY_FEE) {
            // This rejects fee-on-transfer behavior before any accounting is committed.
            revert ExactFundingRequired(ENTRY_FEE, contractBalanceAfter - contractBalanceBefore);
        }
        // Retain a cheap sanity check for unusual ERC-20 implementations.
        require(playerBalanceBefore >= ENTRY_FEE, "entry transfer failed");

        uint256 deadBefore = piggy.balanceOf(DEAD_ADDRESS);
        piggy.safeTransfer(DEAD_ADDRESS, BURN_ALLOCATION);
        uint256 deadAfter = piggy.balanceOf(DEAD_ADDRESS);
        if (deadAfter - deadBefore != BURN_ALLOCATION) {
            revert ExactFundingRequired(BURN_ALLOCATION, deadAfter - deadBefore);
        }

        currentPrizePool += CURRENT_PRIZE_ALLOCATION;
        availableSlotReserve += SLOT_ALLOCATION;
        rolloverReserve += ROLLOVER_ALLOCATION;

        if (lastPlayer == address(0) || lastPlayer == msg.sender) {
            rolloverReserve += PREVIOUS_PLAYER_ALLOCATION;
        } else {
            pendingPreviousRewards[lastPlayer] += PREVIOUS_PLAYER_ALLOCATION;
            totalPendingPreviousRewards += PREVIOUS_PLAYER_ALLOCATION;
        }

        lastPlayer = msg.sender;
        numberOfPlays++;

        requestCreationInProgress = true;
        requestId = s_vrfCoordinator.requestRandomWords(
            VRFV2PlusClient.RandomWordsRequest({
                keyHash: vrfKeyHash,
                subId: vrfSubscriptionId,
                requestConfirmations: vrfRequestConfirmations,
                callbackGasLimit: vrfCallbackGasLimit,
                numWords: NUM_WORDS,
                extraArgs: VRFV2PlusClient._argsToBytes(VRFV2PlusClient.ExtraArgsV1({ nativePayment: vrfPayInNative }))
            })
        );
        requestCreationInProgress = false;
        if (slotRequests[requestId].status != SlotStatus.NONE) revert DuplicateRequestId(requestId);

        slotRequests[requestId] = SlotRequest({
            player: msg.sender,
            maxReserved: R_MAX.toUint96(),
            actualReward: 0,
            requestedAtBlock: block.number.toUint64(),
            roundId: currentRoundId.toUint64(),
            status: SlotStatus.REQUESTED
        });
        availableSlotReserve -= R_MAX;
        reservedSlotLiability += R_MAX;
        activePendingRequests++;

        emit SlotRequestCreated(requestId, msg.sender, currentRoundId, R_MAX, block.number);
        emit Played(
            msg.sender,
            currentRoundId,
            requestId,
            ENTRY_FEE,
            CURRENT_PRIZE_ALLOCATION,
            SLOT_ALLOCATION,
            PREVIOUS_PLAYER_ALLOCATION,
            ROLLOVER_ALLOCATION,
            BURN_ALLOCATION
        );
    }

    function _advanceRoundTimer() internal {
        if (roundStartedAt == 0) {
            roundStartedAt = block.timestamp;
            hardDeadline = block.timestamp + ROUND_HARD_DURATION;
            deadline = block.timestamp + ROUND_FAST_EXTENSION;
            return;
        }

        uint256 elapsed = block.timestamp - roundStartedAt;
        uint256 extension = elapsed < ROUND_EXTENSION_CUTOFF ? ROUND_FAST_EXTENSION : ROUND_SLOW_EXTENSION;
        uint256 proposedDeadline = block.timestamp + extension;
        deadline = proposedDeadline < hardDeadline ? proposedDeadline : hardDeadline;
    }

    function roundStatus() public view returns (RoundPhase) {
        if (roundStartedAt == 0) return RoundPhase.WAITING;
        return block.timestamp < deadline ? RoundPhase.OPEN : RoundPhase.EXPIRED;
    }

    function settleRound() external nonReentrant {
        if (roundStatus() == RoundPhase.WAITING) revert RoundIsWaiting();
        if (roundStatus() != RoundPhase.EXPIRED) revert DeadlineReached();
        if (lastPlayer == address(0)) revert EmptyExpiredRound();

        uint256 settledRoundId = currentRoundId;
        address winner = lastPlayer;
        uint256 prize = currentPrizePool;
        uint256 rollover = rolloverReserve;
        uint256 startedAt = roundStartedAt;
        uint256 oldDeadline = deadline;
        uint256 plays = numberOfPlays;

        currentPrizePool = 0;
        pendingPrizes[winner] += prize;
        totalPendingPrizes += prize;

        currentPrizePool = rollover;
        rolloverReserve = 0;
        currentRoundId++;
        roundStartedAt = 0;
        deadline = 0;
        hardDeadline = 0;
        lastPlayer = address(0);
        numberOfPlays = 0;

        emit RoundSettled(settledRoundId, winner, prize, startedAt, oldDeadline, block.timestamp, plays, rollover);
    }

    function fulfillRandomWords(
        uint256 requestId,
        uint256[] calldata randomWords
    ) internal override {
        SlotRequest storage request = slotRequests[requestId];
        if (request.status != SlotStatus.REQUESTED) {
            bytes32 reason = request.status == SlotStatus.EXPIRED
                ? CALLBACK_REASON_LATE
                : requestCreationInProgress ? CALLBACK_REASON_DURING_REQUEST : CALLBACK_REASON_DUPLICATE_OR_UNKNOWN;
            uint256 callbackRoundId = request.status == SlotStatus.NONE ? currentRoundId : request.roundId;
            emit SlotCallbackIgnored(requestId, callbackRoundId, request.status, reason);
            return;
        }
        if (randomWords.length == 0) {
            emit SlotCallbackInvalid(requestId, request.roundId, CALLBACK_REASON_NO_RANDOM_WORD);
            return;
        }

        uint256 reward = rewardForRoll(randomWords[0] % 10_000);
        request.actualReward = reward.toUint96();
        request.status = SlotStatus.FULFILLED;
        reservedSlotLiability -= R_MAX;
        availableSlotReserve += R_MAX - reward;
        totalPendingSlotRewards += reward;
        pendingSlotRewards[request.player] += reward;
        activePendingRequests--;

        emit SlotRequestFulfilled(requestId, request.player, request.roundId, randomWords[0], reward);
    }

    function expireSlotRequest(
        uint256 requestId
    ) external nonReentrant {
        SlotRequest storage request = slotRequests[requestId];
        if (request.status != SlotStatus.REQUESTED) revert RequestNotFound();
        if (block.number < uint256(request.requestedAtBlock) + REQUEST_TIMEOUT_BLOCKS) revert RequestNotExpired();

        request.status = SlotStatus.EXPIRED;
        reservedSlotLiability -= R_MAX;
        availableSlotReserve += R_MAX;
        activePendingRequests--;

        emit SlotRequestExpired(requestId, request.player, request.roundId);
    }

    function claimSlotRewards() external nonReentrant {
        uint256 amount = pendingSlotRewards[msg.sender];
        if (amount == 0) revert NotClaimable();
        pendingSlotRewards[msg.sender] = 0;
        totalPendingSlotRewards -= amount;
        piggy.safeTransfer(msg.sender, amount);
        emit Claimed(msg.sender, currentRoundId, CLAIM_KIND_SLOT, amount);
    }

    function claimPreviousRewards() external nonReentrant {
        uint256 amount = pendingPreviousRewards[msg.sender];
        if (amount == 0) revert NotClaimable();
        pendingPreviousRewards[msg.sender] = 0;
        totalPendingPreviousRewards -= amount;
        piggy.safeTransfer(msg.sender, amount);
        emit Claimed(msg.sender, currentRoundId, CLAIM_KIND_PREVIOUS, amount);
    }

    function claimPrize() external nonReentrant {
        uint256 amount = pendingPrizes[msg.sender];
        if (amount == 0) revert NotClaimable();
        pendingPrizes[msg.sender] = 0;
        totalPendingPrizes -= amount;
        piggy.safeTransfer(msg.sender, amount);
        emit Claimed(msg.sender, currentRoundId, CLAIM_KIND_PRIZE, amount);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function totalLiabilities() public view returns (uint256) {
        return currentPrizePool + availableSlotReserve + reservedSlotLiability + totalPendingSlotRewards
            + totalPendingPreviousRewards + rolloverReserve + totalPendingPrizes;
    }

    function contractBalance() public view returns (uint256) {
        return piggy.balanceOf(address(this));
    }

    function accountingSurplus() public view returns (uint256) {
        // An underflow here is deliberate: it exposes an accounting violation rather
        // than masking insolvency as a zero surplus.
        return contractBalance() - totalLiabilities();
    }

    function rewardForRoll(
        uint256 roll
    ) public pure returns (uint256) {
        if (roll < 8_000) return 0;
        if (roll < 9_500) return 10 ether;
        if (roll < 9_950) return 20 ether;
        if (roll < 10_000) return 50 ether;
        revert InvalidCallback();
    }

    function getSlotRequest(
        uint256 requestId
    ) external view returns (SlotRequest memory) {
        return slotRequests[requestId];
    }
}
