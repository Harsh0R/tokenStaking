import React, { useContext, useEffect, useState } from 'react';
import { StakeTokenContext } from '../../Context/StakeTokenContext';

const Home = () => {
    const { pools, stake } = useContext(StakeTokenContext);
    const [poolsData, setPoolsData] = useState([]);

    useEffect(() => {
        async function fetchData() {
            try {
                const data = await pools();
                console.log("Pools data:", data[0][0].toNumber());
                setPoolsData(data);
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

    return (
        <div>
            {poolsData.length > 0 && poolsData.map((el, index) => (
                <React.Fragment key={index}>
                    <li>
                        <button onClick={() => stakeToken(index)}>
                            Duration: {el[0].toNumber()}
                            <br />
                            RewardRate: {el[1].toNumber() / 100}%
                        </button>
                    </li>
                    <br />
                </React.Fragment>
            ))}
        </div>
    );
}

export default Home;
