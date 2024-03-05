// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MyCustomToken is ERC20 {
    constructor() ERC20("TokenStaking", "TSC") {
        _mint(msg.sender, 1e6 * 10**uint256(decimals()));
    }
}

contract TokenStaking is Ownable, ReentrancyGuard {
    IERC20 public stakingToken;
    uint256 public constant PERCENTAGE_DENOMINATOR = 100;

    struct Pool {
        uint256 duration;
        uint256 rewardRate;
        mapping(address => uint256) balances;
        mapping(address => uint256) depositTimes;
        mapping(address => uint256) lastProfitWithdrawalTime;
    }

    mapping(uint8 => Pool) public poolData;

    uint256 private _totalStakedToken;
    event ProfitWithdrawn(address indexed user, uint256 profit, uint8 poolId);
    event Staked(address indexed user, uint256 amount, uint8 poolId);
    event Withdrawn(
        address indexed user,
        uint256 amount,
        uint256 reward,
        uint8 poolId
    );
    Pool[4] public pools;

    constructor() {
        MyCustomToken token = new MyCustomToken();
        stakingToken = token;
        pools[0].duration = 7 days;
        pools[0].rewardRate = 570;

        pools[1].duration = 30 days;
        pools[1].rewardRate = 690;

        pools[2].duration = 90 days;
        pools[2].rewardRate = 980;

        pools[3].duration = 360 days;
        pools[3].rewardRate = 1200;

        stakingToken.transfer(msg.sender, 1000000000000000000000);
    }

    function stake(uint256 _amount, uint8 _poolId) external nonReentrant {
        require(_poolId >= 0 && _poolId < 4, "Invalid pool id");
        require(_amount > 0, "Amount must be greater than 0");
        Pool storage pool = pools[_poolId];

        require(
            stakingToken.balanceOf(msg.sender) >= _amount,
            "Insufficient balance"
        );
        require(
            stakingToken.allowance(msg.sender, address(this)) >= _amount,
            "Insufficient allowance"
        );

        stakingToken.transferFrom(msg.sender, address(this), _amount);
        pool.balances[msg.sender] += _amount;
        pool.depositTimes[msg.sender] = block.timestamp;
        _totalStakedToken += _amount;
        emit Staked(msg.sender, _amount, _poolId);
    }

    function max(uint256 a, uint256 b) private pure returns (uint256) {
        return a >= b ? a : b;
    }

    function calculateProfit(address user, uint8 poolId)
        public
        view
        returns (uint256)
    {
        require(poolId >= 0 && poolId < 4, "Invalid pool id");
        Pool storage pool = pools[poolId];
        uint256 userBalance = pool.balances[user];
        if (userBalance == 0) {
            return 0;
        }

        uint256 lastActionTime = max(
            pool.depositTimes[user],
            pool.lastProfitWithdrawalTime[user]
        );

        // uint256 depositTime = pool.depositTimes[user];
        uint256 currentTime = block.timestamp;
        uint256 stakedDuration = currentTime - lastActionTime;

        uint256 rewardRatePerYear = pool.rewardRate;
        uint256 secondsInYear = 365 days;

        uint256 rewardRatePerSecond = (rewardRatePerYear * 10**18) /
            secondsInYear /
            PERCENTAGE_DENOMINATOR;
        uint256 profit = (stakedDuration * rewardRatePerSecond * userBalance) /
            10**18;
        if (stakedDuration < pool.duration) {
            return profit;
        } else {
            return (userBalance * pool.rewardRate) / PERCENTAGE_DENOMINATOR;
        }
    }

    function withdraw(uint8 _poolId) external nonReentrant {
        require(_poolId >= 0 && _poolId < 4, "Invalid pool id");
        Pool storage pool = pools[_poolId];
        uint256 amount = pool.balances[msg.sender];
        require(amount > 0, "No balance to withdraw");

        uint256 stakedDuration = block.timestamp -
            pool.depositTimes[msg.sender];
        uint256 reward = 0;
        if (stakedDuration >= pool.duration) {
            reward = calculateReward(amount, pool.rewardRate);
        }

        pool.balances[msg.sender] = 0;
        pool.depositTimes[msg.sender] = 0;

        stakingToken.transfer(msg.sender, amount + reward);

        emit Withdrawn(msg.sender, amount, reward, _poolId);
    }

    function withdrawSpecificProfit(uint256 amount, uint8 _poolId)
        external
        nonReentrant
    {
        require(_poolId >= 0 && _poolId < 4, "Invalid pool id");

        uint256 profit = calculateProfit(msg.sender, _poolId);
        require(profit >= amount, "TokenStaking: Not enough profit");

        // Deduct the specific amount from the user's profit
        pools[_poolId].lastProfitWithdrawalTime[msg.sender] = block.timestamp; // Reset profit calculation basis

        stakingToken.transfer(msg.sender, amount); // Transfer specific profit amount

        emit ProfitWithdrawn(msg.sender, amount, _poolId); // Emit an event for the profit withdrawal
    }

    function calculateReward(uint256 _amount, uint256 _rewardRate)
        private
        pure
        returns (uint256)
    {
        return (_amount * _rewardRate) / 10000;
    }

    function withdrawProfit(uint8 _poolId) external nonReentrant {
        require(_poolId >= 0 && _poolId < 4, "Invalid pool id");

        uint256 profit = calculateProfit(msg.sender, _poolId);
        require(profit > 0, "No profit available for withdrawal");

        Pool storage pool = pools[_poolId];
        pool.depositTimes[msg.sender] = block.timestamp;

        stakingToken.transfer(msg.sender, profit);

        emit ProfitWithdrawn(msg.sender, profit, _poolId);
    }
}
