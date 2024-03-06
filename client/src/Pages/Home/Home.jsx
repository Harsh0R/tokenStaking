import React, { useContext, useEffect, useState } from 'react';
import { StakeTokenContext } from '../../Context/StakeTokenContext';
const Home = () => {
    const { pools, stake, showMyBalancesInPool, calculateProfit, account, withdrawProfit, withdrawAllAmount } = useContext(StakeTokenContext);
    const [poolsData, setPoolsData] = useState([]);
    const [myBalance, setMyBalance] = useState([]);
    const [myProfit, setMyProfit] = useState([]);

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
            updateProfit();
            intervalId = setInterval(updateProfit, 1000);
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
                const myBalance = await showMyBalancesInPool();
                const myProfit = account ? await calculateProfit() : [];
                // console.log("Pools data:", data[0][0].toNumber());
                setPoolsData(data);
                setMyBalance(myBalance);
                setMyProfit(myProfit);
            } catch (error) {
                console.error("Failed to fetch pools data:", error);
            }
        }
        fetchData();
    }, []);

    const stakeToken = (idx) => {
        console.log("IDX === === == ", idx);
        stake(idx);
    };
    const withdrawProfitToken = (idx) => {
        console.log("IDX === === == ", idx);
        withdrawProfit(idx);
    };
    const withdrawAllAmountToken = (idx) => {
        console.log("IDX === === == ", idx);
        withdrawAllAmount(idx);
    };

    return (
        <div>
            {poolsData.length > 0 && poolsData.map((el, index) => (
                <React.Fragment key={index}>
                    <li>
                        <button onClick={() => stakeToken(index)}>
                            Duration: {el[0]?.toNumber() ?? 'Loading...'}
                            <br />
                            RewardRate: {el[1]?.toNumber() / 100 ?? 'Loading...'}%
                        </button>
                        show my deposit : {myBalance[index]?.toString() ?? 'N/A'} TSC ,
                        show my Profit : {myProfit[index]?.toString() ?? 'N/A'} TSC
                        <button onClick={() => withdrawProfitToken(index)}>
                            withdraw : {myProfit[index]?.toString() ?? 'N/A'} TSC
                        </button>
                        <button onClick={() => withdrawAllAmountToken(index)}>
                            withdraw All Mount
                        </button>
                    </li>
                    <br />
                </React.Fragment>
            ))}
        </div>
    );

}

export default Home;
