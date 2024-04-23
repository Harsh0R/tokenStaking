import React, { useContext, useEffect, useState } from 'react';
import { StakeTokenContext } from '../../Context/StakeTokenContext';
import Style from "./Home.module.css"

const Home = () => {
    const { pools, stake, calculateProfit, account, withdrawProfit, withdrawAllAmount, addReferral, stakeAmountOfUserInPool, balance , getTotalWithdrawalAmount } = useContext(StakeTokenContext);
    const [poolsData, setPoolsData] = useState([]);
    const [myBalance, setMyBalance] = useState([]);
    const [myProfit, setMyProfit] = useState([]);
    const [referrerAddress, setReferrerAddress] = useState()
    const [stakeAmount, setStakeAmount] = useState("");
    const [getPoolProfit, setgetPoolProfit] = useState([])

    useEffect(() => {
        let intervalId;

        const updateProfit = async () => {
            if (account) {
                try {
                    const profit = await calculateProfit();
                    setMyProfit(profit);
                } catch (error) {
                    console.error("Failed to fetch profit data:", error);
                }
            }
        };

        if (account) {
            intervalId = setInterval(updateProfit, 2000);
        }

        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [account]);

    useEffect(() => {
        async function fetchData() {
            try {
                const data = await pools();
                const myProfit = account ? await calculateProfit() : [];
                setPoolsData(data);
                setMyProfit(myProfit);
            } catch (error) {
                console.error("Failed to fetch pools data:", error);
            }
        }
        fetchData();
    }, []);

    const handleStakeAmountChange = (e) => {
        setStakeAmount(e.target.value);
    };
    

    const getAppProfitOfThisPool =async (idx) => {
        const bal =await getTotalWithdrawalAmount(idx);
        // setgetPoolProfit(bal)
        setgetPoolProfit(prev => ({ ...prev, [idx]: bal }));
    };


    const showMyBalancesInPoolToken = async (account, idx) => {
        console.log("IDX === === = ==> ", idx);
        const balance = await stakeAmountOfUserInPool(idx);
        console.log("My balance ==>? ", balance);
        setMyBalance(prev => ({ ...prev, [idx]: balance }));
    };

    const handleStake = (index) => {
        stake(index, stakeAmount);
    };

    const withdrawProfitToken = (idx) => {
        withdrawProfit(idx);
    };
    const withdrawAllAmountToken = (idx) => {
        withdrawAllAmount(idx);
    };
    const handleAddReferral = async () => {
        if (!referrerAddress) {
            alert("Please enter a referrer address.");
            return;
        }
        try {
            await addReferral(referrerAddress);
            alert("Referral added successfully!");
        } catch (error) {
            console.error("Failed to add referral:", error);
            alert("Failed to add referral. See console for details.");
        }
    };

    return (
        <div className={Style.container}>
            <div>
                Account := {account}
            </div>
            <div>
                <input
                    className={Style.inputField}
                    type="text"
                    value={referrerAddress}
                    onChange={(e) => setReferrerAddress(e.target.value)}
                    placeholder="Enter Referrer Address"
                />
                <button className={Style.button} onClick={handleAddReferral}>Add Referral</button>
            </div>
            <div>
                Show Balance : {balance}
            </div>
            <div>
                Enter Stake Amount : <input
                    className={Style.inputField}
                    type="number" // Assuming you're dealing with a numeric value
                    value={stakeAmount}
                    onChange={handleStakeAmountChange}
                    placeholder="Enter stake amount"
                />
            </div>
            <div className={Style.poolsContainer}>
                {poolsData.length > 0 && poolsData.map((el, index) => (
                    <React.Fragment key={index}>
                        <li className={Style.listItem}>
                            <div className={Style.inputGroup}>
                                <button className={Style.button} onClick={() => handleStake(index)}>Stake</button>
                            </div>
                            <div>
                                Duration: {el[0]?.toNumber() ?? 'Loading...'} second
                                <br />
                                RewardRate: {el[1]?.toNumber() / 100 ?? 'Loading...'}%
                            </div>
                            <button className={Style.listButton} onClick={() => showMyBalancesInPoolToken(account, index)} key={index}>
                                Balance: {myBalance[index]?.toString() ?? 'N/A'} TSC
                            </button>
                            {/* show my Profit: {myProfit[index]?.toString() ?? 'N/A'} TSC */}
                            <button className={Style.listButton} onClick={() => withdrawProfitToken(index)}>
                                withdraw: {myProfit[index]?.toString() ?? 'N/A'} TSC
                            </button>
                            <button className={Style.listButton} onClick={() => withdrawAllAmountToken(index)}>
                                withdraw All Amount
                            </button>
                            <button className={Style.listButton} onClick={() => getAppProfitOfThisPool(index)}>
                                Show All withdraw Profit of this pool : {getPoolProfit[index]?.toString() ?? 'N/A'}
                            </button>
                        </li>
                        <br />
                    </React.Fragment>
                ))}
            </div>
        </div>
    );


}

export default Home;
