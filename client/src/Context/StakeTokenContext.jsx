import { useEffect, useState, React, createContext } from "react";
import { createClient } from "urql"
import {
  connectWallet,
  checkIfWalletConnected,
  connectingWithContract,
  tokenContract
} from "../Utils/web3Setup";
import { smartContractAddress } from "./constants";
import { ethers } from "ethers";

export const StakeTokenContext = createContext();

export const StakeTokenProvider = ({ children }) => {
  const [account, setAccount] = useState("");
  const [balance, setBalance] = useState()

  useEffect(() => {
    const fetchData = async () => {
      try {
        window.ethereum.on("chainChanged", () => window.location.reload());
        window.ethereum.on("accountsChanged", () => window.location.reload());

        const connectAccount = await connectWallet();
        setAccount(connectAccount);
        balanceOf(connectAccount);
      } catch (error) {
        console.log("Error in fetching account in StakeTokenContext", error);
      }
    };

    fetchData();

    // Cleanup function to remove event listeners when component unmounts
    return () => {
      window.ethereum.removeListener("chainChanged", () => window.location.reload());
      window.ethereum.removeListener("accountsChanged", () => window.location.reload());
    };
  }, []);


  const pools = async () => {
    try {
      const contract = await connectingWithContract();
      const poolIndices = [0, 1, 2, 3]; // Define an array of your pool indices

      const poolPromises = poolIndices.map(index => contract.pools(index));
      const results = await Promise.all(poolPromises);

      return results;
    } catch (error) {
      console.error("Error occurred fetching pools data:", error);
    }
  };

  const stake = async (poolIdx, amount) => {
    try {
      // Fetch the current allowance
      let allowanceAmount = await hasValideAllowance(account);

      // Convert the input amount to Wei as a BigNumber for comparison
      const amountInWei = ethers.utils.parseUnits(amount.toString(), 18);

      // Make sure allowanceAmount is a BigNumber. Convert it if necessary.
      if (!(allowanceAmount instanceof ethers.BigNumber)) {
        allowanceAmount = ethers.BigNumber.from(allowanceAmount);
      }

      // Compare the allowanceAmount with the amountInWei
      if (allowanceAmount.lt(amountInWei)) {
        console.log("Increasing allowance");
        await increaseAllowance(amount); // Wait for the increase allowance transaction to complete
      }

      const contract = await connectingWithContract();
      // Ensure to await the transaction to be sent
      const tx = await contract.stake(amountInWei, poolIdx);
      await tx.wait(); // Wait for the transaction to be mined
      console.log("Stake transaction: ", tx);
    } catch (error) {
      console.error("Error in stake function: ", error);
    }
  };

  const showOnePoolBalances = async (account1, index) => {
    try {
      const contract = await connectingWithContract();
      console.log("Address111 === ", account1);
      const results = await contract.showMyBalancesInPool(account1, index);
      const results1 = await toEth(results);
      console.log("BA;amce = ", results1);
      return results1;
    } catch (error) {
      console.error("Error occurred fetching one showMyBalancesInPool data:", error);
    }
  };

  const showMyBalancesInPool = async (account1) => {
    try {
      const contract = await connectingWithContract();
      const poolIndices = [0, 1, 2, 3];
      // console.log("Address111 === " , account1);
      const poolPromises = poolIndices.map(index => contract.showMyBalancesInPool(account1, index));
      const results = await Promise.all(poolPromises);
      const results1 = await Promise.all(results.map(idx => toEth(idx)));

      // console.log("Res ===", results);
      // console.log("Res1 ===", results1);
      return results1;
    } catch (error) {
      console.error("Error occurred fetching showMyBalancesInPool data:", error);
    }
  };

  const calculateProfit = async () => {
    try {
      const contract = await connectingWithContract();
      const poolIndices = [0, 1, 2, 3];

      const poolPromises = poolIndices.map(index => contract.calculateProfit(account, index));
      const results = await Promise.all(poolPromises);

      const results1 = await Promise.all(results.map(idx => toEth(idx)));
      // console.log("Calculate profit = ",poolPromises);
      return results1;
    } catch (error) {
      console.error("Error occurred fetching Calculate profit =:", error);
    }
  };

  const addReferral = async (referrerAddress) => {
    const contract = await connectingWithContract();
    const tx = await contract.addReferral(referrerAddress);
    await tx.wait();
    // Handle post-transaction logic or state updates here
  };

  const withdrawProfit = async (index) => {
    try {
      const contract = await connectingWithContract();

      const results = contract.withdrawProfit(index);
      console.log("Calculate withdraw profit = ", results);
    } catch (error) {
      console.error("Error occurred fetching withdrawProfit =:", error);
    }
  };

  const withdrawAllAmount = async (index) => {
    try {
      const contract = await connectingWithContract();

      const results = contract.withdrawAllAmount(index);
      console.log("withdraw All Amount profit = ", results);
    } catch (error) {
      console.error("Error occurred fetching withdrawAllAmount =:", error);
    }
  };

  const hasValideAllowance = async (owner) => {
    try {
      const contractObj = await connectingWithContract();
      const address = await contractObj.stakingToken();

      const tokenContractObj = await tokenContract(address);
      const data = await tokenContractObj.allowance(
        owner,
        smartContractAddress
      );
      const result = ethers.BigNumber.from(data._hex.toString());
      console.log("allowance === ", result);
      return result;
    } catch (e) {
      return console.log(e);
    }
  }

  const increaseAllowance = async (amount) => {
    try {
      const contractObj = await connectingWithContract();
      const address = await contractObj.stakingToken();
      console.log(":Token Address ==> " , address);
      const tokenContractObj = await tokenContract(address);
      const data = await tokenContractObj.approve(
        smartContractAddress,
        toWei(amount)
      );
      const result = await data.wait();
      return result;
    } catch (e) {
      return console.log("Error at Increase allowence = ", e);
    }
  }

  const balanceOf = async (account1 = amount) => {
    try {
      const contractObj = await connectingWithContract();
      const address = await contractObj.stakingToken();

      const tokenContractObj = await tokenContract(address);
      const data = await tokenContractObj.balanceOf(
        account1
      );
      console.log("balance = ", data);
      const result = await toEth(data);
      setBalance(result)
      // return result;
    } catch (e) {
      return console.log("Error at Increase allowence = ", e);
    }
  }

  const toWei = async (amount) => {
    const toWie = ethers.utils.parseUnits((amount).toString());
    console.log("toWie = ", toWie.toString());
    return toWie.toString();
  }

  const toEth = async (amount) => {
    const toEth = ethers.utils.formatUnits(amount, 18);
    return toEth.toString();
  }

  // GraphQL

  const QueryUrl = "https://api.studio.thegraph.com/query/56822/tokenstakinggraph/0.0.10"
  const client = createClient({
    url: QueryUrl
  });

  const stakeAmountOfUserInPool = async (poolId, user = account) => {
    console.log("Acc and PoolId = ", user, "+>", poolId);

    const query = `{
      stakedAmounts: stakeds(where: {user: "${user}", poolId:${poolId}}) {
        amount
      }
      withdrawnAmounts: withdrawns(where: {user:"${user}" , poolId:${poolId} }) {
        amount
      }
    }`;

    const { data } = await client.query(query).toPromise();

    const totalStaked = data.stakedAmounts.reduce((acc, curr) => acc + BigInt(curr.amount), BigInt(0));

    const totalWithdrawn = data.withdrawnAmounts.reduce((acc, curr) => acc + BigInt(curr.amount), BigInt(0));

    const currentStakedAmount = totalStaked - totalWithdrawn;

    const result = await toEth(currentStakedAmount);
    console.log(`Current Staked Amount: ${result} Ether`);
    if (result < 0) {
      return 0;
    } else {
      return result;
    }
  };

  const getTotalWithdrawalAmount = async (poolId, user = account) => {
    const query = `{
      profitWithdrawns(where: {user:"${user}" , poolId:${poolId}}) {
        profit
      }
    }`
    try {
      const { data } = await client.query(query).toPromise();

      if (data && data.profitWithdrawns) {
        const totalProfitWei = data.profitWithdrawns.reduce((acc, curr) => acc + BigInt(curr.profit), BigInt(0));

        const totalProfitEther = await toEth(totalProfitWei);

        console.log(`Total Withdrawal Amount: ${totalProfitEther.toString()} Ether`);

        return totalProfitEther.toString();
      }
    } catch (error) {
      console.error("Failed to fetch total withdrawal amount:", error);
      return "0";
    }

  }

  const getAllStakeData = async () => {
    const query = `{
      userDatas {
        poolId
        user
        withdrawProfit
        currentStake
        transactionHash
        blockTimestamp
      }
    }`

    const { data } = await client.query(query).toPromise();
  }



  return (
    <StakeTokenContext.Provider
      value={{
        account,
        balance,
        pools,
        stake,
        showMyBalancesInPool,
        calculateProfit,
        withdrawProfit,
        withdrawAllAmount,
        addReferral,
        showOnePoolBalances,
        stakeAmountOfUserInPool,
        balanceOf,
        getTotalWithdrawalAmount
      }}
    >
      {children}
    </StakeTokenContext.Provider>
  );
};
