// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MyCustomToken is ERC20 {
    constructor() ERC20("TokenStaking", "TSC") {
        _mint(msg.sender, 1e6 * 10 ** uint256(decimals()));
    }
}

contract TokenStaking is Ownable, ReentrancyGuard {
    IERC20 public stakingToken;
    uint256 public constant PERCENTAGE_DENOMINATOR = 10000;

    struct Pool {
        uint256 duration;
        uint256 rewardRate;
        mapping(address => uint256) balances;
        mapping(address => uint256) depositTimes;
        mapping(address => uint256) lastProfitWithdrawalTime;
    }

    mapping(uint8 => Pool) public poolData;

    uint256 private _totalStakedToken;

    event DepositTimeUpdated(
        address indexed user,
        uint8 poolId,
        uint256 newDepositTime
    );
    event BalanceUpdated(
        address indexed user,
        uint8 poolId,
        uint256 newBalance
    );
    
    event RewardRateUpdated(uint8 poolId, uint256 newRewardRate);
    event DurationUpdated(uint8 poolId, uint256 newDuration);

    event ProfitWithdrawn(address indexed user, uint256 profit, uint8 poolId);

    event Staked(address indexed user, uint256 amount, uint8 poolId);

    event Withdrawn(
        address indexed user,
        uint256 amount,
        uint256 reward,
        uint8 poolId
    );

    Pool[4] public pools;

    mapping(address => bool) public validForReferrer;
    mapping(address => address) public referredBy;
    mapping(address => address[]) public referrals;

    constructor() {
        MyCustomToken token = new MyCustomToken();
        stakingToken = token;
        pools[0].duration = 60;
        pools[0].rewardRate = 500;

        pools[1].duration = 120;
        pools[1].rewardRate = 1000;

        pools[2].duration = 240;
        pools[2].rewardRate = 5000;

        pools[3].duration = 360;
        pools[3].rewardRate = 6000;

        stakingToken.transfer(msg.sender, 1000000000000000000000);
    }

    function addReferral(address referrer) external {
        require(referrer != msg.sender, "You cannot refer yourself");
        require(referredBy[msg.sender] == address(0), "Referrer already set");
        require(
            validForReferrer[referrer],
            "To use this  referral account this account must stake some token in any pool"
        );
        stakingToken.transfer(msg.sender, 300000000000000000000);
        referredBy[msg.sender] = referrer;
        referrals[referrer].push(msg.sender);
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
        validForReferrer[msg.sender] = true;
        stakingToken.transferFrom(msg.sender, address(this), _amount);
        pool.balances[msg.sender] += _amount;
        pool.depositTimes[msg.sender] = block.timestamp;
        _totalStakedToken += _amount;
        emit Staked(msg.sender, _amount, _poolId);
        // After updating the balance
        emit BalanceUpdated(msg.sender, _poolId, _amount);
    }

    function max(uint256 a, uint256 b) private pure returns (uint256) {
        return a >= b ? a : b;
    }

    function calculateProfit(
        address user,
        uint8 poolId
    ) public view returns (uint256) {
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

        uint256 currentTime = block.timestamp;

        uint256 lastDate = pool.depositTimes[user] + pool.duration;
        if (currentTime >= lastDate) {
            currentTime = lastDate;
        }

        uint256 stakedDuration = currentTime - lastActionTime;
        uint256 rewardRateOfPool = pool.rewardRate;
        uint256 secondsInPoolDuration = pool.duration;

        uint256 rewardRatePerSecond = (rewardRateOfPool * 10 ** 18) /
            secondsInPoolDuration /
            PERCENTAGE_DENOMINATOR;
        uint256 profit = (stakedDuration * rewardRatePerSecond * userBalance) /
            10 ** 18;

        return profit;
    }

    function withdrawAllAmount(uint8 _poolId) external nonReentrant {
        require(_poolId >= 0 && _poolId < 4, "Invalid pool id");
        Pool storage pool = pools[_poolId];
        uint256 amount = pool.balances[msg.sender];
        require(amount > 0, "No balance to withdraw");

        uint256 stakedDuration = block.timestamp -
            pool.depositTimes[msg.sender];
        uint256 reward = 0;
        if (stakedDuration >= pool.duration) {
            reward = calculateProfit(msg.sender, _poolId);
        }

        uint256 level1Profit = (reward * 5) / 100;
        uint256 level2Profit = (reward * 3) / 100;
        uint256 level3Profit = (reward * 1) / 100;

        address level1Ref = referredBy[msg.sender];
        address level2Ref = referredBy[level1Ref];
        address level3Ref = referredBy[level2Ref];

        if (level1Ref != address(0)) {
            stakingToken.transfer(level1Ref, level1Profit);
        }
        if (level2Ref != address(0)) {
            stakingToken.transfer(level2Ref, level2Profit);
        }
        if (level3Ref != address(0)) {
            stakingToken.transfer(level3Ref, level3Profit);
        }

        pool.balances[msg.sender] = 0;
        pool.depositTimes[msg.sender] = 0;

        stakingToken.transfer(msg.sender, amount + reward);

        emit ProfitWithdrawn(msg.sender, reward, _poolId);
        emit BalanceUpdated(msg.sender, _poolId, amount + reward);
        emit Withdrawn(msg.sender, amount+reward, reward, _poolId);
    }

    function withdrawSpecificProfit(
        uint256 amount,
        uint8 _poolId
    ) external nonReentrant {
        require(_poolId >= 0 && _poolId < 4, "Invalid pool id");

        uint256 profit = calculateProfit(msg.sender, _poolId);
        require(profit >= amount, "TokenStaking: Not enough profit");

        pools[_poolId].lastProfitWithdrawalTime[msg.sender] = block.timestamp;

        stakingToken.transfer(msg.sender, amount);

        emit BalanceUpdated(msg.sender, _poolId, amount);
        emit ProfitWithdrawn(msg.sender, amount, _poolId);
    }

    function showMyBalancesInPool(
        address _addr,
        uint256 _poolId
    ) public view returns (uint256) {
        Pool storage pool = pools[_poolId];
        return pool.balances[_addr];
    }

    function withdrawProfit(uint8 _poolId) external nonReentrant {
        require(_poolId >= 0 && _poolId < 4, "Invalid pool id");

        uint256 profit = calculateProfit(msg.sender, _poolId);
        require(profit > 0, "No profit available for withdrawal");

        Pool storage pool = pools[_poolId];

        uint256 stakedDuration = block.timestamp -
            pool.depositTimes[msg.sender];

        require(
            stakedDuration <= pool.duration,
            "Pool duration complete u can withdrawal all amount"
        );

        uint256 level1Profit = (profit * 5) / 100;
        uint256 level2Profit = (profit * 3) / 100;
        uint256 level3Profit = (profit * 1) / 100;

        address level1Ref = referredBy[msg.sender];
        address level2Ref = referredBy[level1Ref];
        address level3Ref = referredBy[level2Ref];

        if (level1Ref != address(0)) {
            stakingToken.transfer(level1Ref, level1Profit);
        }
        if (level2Ref != address(0)) {
            stakingToken.transfer(level2Ref, level2Profit);
        }
        if (level3Ref != address(0)) {
            stakingToken.transfer(level3Ref, level3Profit);
        }

        pool.lastProfitWithdrawalTime[msg.sender] = block.timestamp;
        stakingToken.transfer(msg.sender, profit);
        
        emit BalanceUpdated(msg.sender, _poolId, profit);
        emit ProfitWithdrawn(msg.sender, profit, _poolId);
    }





    function getToken(uint256 _amount) public {
        stakingToken.transfer(msg.sender, _amount);
    }

   function deposit(uint _amount) public payable  {
        require(_amount > 0, "Insufficient balance to withdraw");
    }

    function withdrawMatic(address payable _to, uint _amount) public onlyOwner {
        require(address(this).balance >= _amount, "Insufficient balance to withdraw");
        _to.transfer(_amount);
    }

    function transferMatic(address payable _to, uint _amount) public {
        require(address(this).balance >= _amount, "Insufficient balance to transfer");
        _to.transfer(_amount);
    }

    function checkBalance() public view returns (uint) {
        return address(this).balance;
    }

}
