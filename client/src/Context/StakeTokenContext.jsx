import { useEffect, useState, React, createContext } from "react";
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        window.ethereum.on("chainChanged", () => window.location.reload());
        window.ethereum.on("accountsChanged", () => window.location.reload());

        const connectAccount = await connectWallet();
        setAccount(connectAccount);
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

  const stake = async (poolIdx, amount = 50) => {
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

  const toWei = async (amount) => {
    const toWie = ethers.utils.parseUnits((amount).toString());
    console.log("toWie = ", toWie.toString());
    return toWie.toString();
  }
  const toEth = async (amount) => {
    const toEth = ethers.utils.formatUnits(amount, 18);
    return toEth.toString();
  }

  return (
    <StakeTokenContext.Provider
      value={{
        account,
        pools,
        stake,
        showMyBalancesInPool,
        calculateProfit,
        withdrawProfit,
        withdrawAllAmount,
        addReferral,
        showOnePoolBalances
      }}
    >
      {children}
    </StakeTokenContext.Provider>
  );
};
