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

  const fetchData = async () => {
    try {
      window.ethereum.on("chainChanged", () => {
        window.location.reload();
      });

      window.ethereum.on("accountsChanged", () => {
        window.location.reload();
      });

      const connectAccount = await connectWallet();
      const contract = await connectingWithContract();
      // console.log("contract = " , contract);
      // console.log("Account = " , connectAccount);

      setAccount(connectAccount);

    } catch (error) {
      console.log("Error in fetching account in StakeTokenContext...", error);
    }
  };


  useEffect(() => {
    fetchData();
  }, []);



  const pools = async () => {
    try {
      const contract = await connectingWithContract();
      const poolIndices = [0, 1, 2, 3]; // Define an array of your pool indices

      // Use Promise.all to wait for all contract.pools(i) promises to resolve
      const poolPromises = poolIndices.map(index => contract.pools(index));
      const results = await Promise.all(poolPromises);

      return results;
    } catch (error) {
      console.error("Error occurred fetching pools data:", error);
    }
  };

  const stake = async ( poolIdx,amount=50) => {
    try {
      const amount1 = toWei(amount);
      const contract = await connectingWithContract();
      const tx = contract.stake(amount1, poolIdx);

      console.log("Stake = ", amount1," idx =" , poolIdx , "tx ===" , tx);
    } catch (error) {
      console.error("Error occurred fetching pools data:", error);
    }
  };


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


  return (
    <StakeTokenContext.Provider
      value={{
        account,
        pools,
        stake,
      }}
    >
      {children}
    </StakeTokenContext.Provider>
  );
};
