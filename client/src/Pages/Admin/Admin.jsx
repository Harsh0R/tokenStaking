import React, { useState, useEffect } from 'react';
import { createClient } from 'urql';
import Style from "./Admin.module.css"

const client = createClient({
  url: 'https://api.studio.thegraph.com/query/56822/tokenstakinggraph/0.0.10', 
});

const Admin = () => {
  const [stakeData, setStakeData] = useState([]);

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
    }`;

    try {
      const result = await client.query(query).toPromise();
      if (result.data) {
        setStakeData(result.data.userDatas);
      }
    } catch (error) {
      console.error('Error fetching stake data:', error);
    }
  };
  useEffect(() => {
    getAllStakeData();
  }, []);

  const formatDate = (timestamp) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-US');
  };

  return (
    <div className={Style.container}>
      <h1>Stake Data</h1>
      <table>
        <thead>
          <tr>
            <th>Pool ID</th>
            <th>User Address</th>
            <th>Withdrawn Profit</th>
            <th>Current Stake</th>
            <th>Date</th>
            <th>Tx Hash</th>
          </tr>
        </thead>
        <tbody>
          {stakeData.map((data, index) => (
            <tr key={index}>
              <td>{data.poolId}</td>
              <td>{data.user}</td>
              <td>{data.withdrawProfit}</td>
              <td>{data.currentStake}</td>
              <td>{formatDate(data.blockTimestamp)}</td>
              <td>
                <a href={`https://mumbai.polygonscan.com/tx/${data.transactionHash}`} target="_blank" rel="noopener noreferrer">
                  {data.transactionHash}
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Admin;
