import React, { useEffect, useState } from "react";
import DarkModeToggle from "react-dark-mode-toggle";
import { BallScaleRandom } from 'react-pure-loaders';
import { ethers } from "ethers";
import './App.css';
import abi from './utils/WavePortal.json'

import { ThemeProvider } from 'styled-components';
import { lightTheme, darkTheme } from './theme';
import { GlobalStyles } from './global';


const App = () => {
  const [isDarkMode, setIsDarkMode] = useState(window.localStorage.getItem('isDarkMode'));
  const [currentAccount, setCurrentAccount] = useState("");
  const [waveMessage, setWaveMessage] = useState("");
  const [allWaves, setAllWaves] = useState([]);
  const [mining, setMining] = useState(false);

  const contractAddress = "0x98B71a6bd534feaAd17bb401FB85B93B00E1D547";
  const contractABI = abi.abi;

  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        console.log("Make sure you have metamask!");
        return;
      } else {
        console.log("We have the ethereum object", ethereum);
      }

      /*
      * Check if we're authorized to access the user's wallet
      */
      const accounts = await ethereum.request({ method: 'eth_accounts' });

      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authorized account:", account);
        getAllWaves()
        setCurrentAccount(account)
      } else {
        console.log("No authorized account found")
      }
    } catch (error) {
      console.log(error);
    }
  }

   const getAllWaves = async () => {
    const { ethereum } = window;

    try {
      if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        const waves = await wavePortalContract.getAllWaves();

        let wavesCleaned = [];
        waves.forEach(wave => {
          wavesCleaned.push({
            address: wave.waver,
            timestamp: new Date(wave.timestamp * 1000),
            message: wave.message
          });
        });

        setAllWaves(wavesCleaned);

        /* with debug purposes, listen to events */
        wavePortalContract.on("NewWave", (from, timestamp, message, value) => {
          console.log("NewWave", from, timestamp, message, value);
        });
      } else {
        console.log("Ethereum object doesn't exist!")
      }
    } catch (error) {
      console.log(error);
    }
  }

  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      const accounts = await ethereum.request({ method: "eth_requestAccounts" });

      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]); 
    } catch (error) {
      console.log(error)
    }
  }

  const wave = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const waveportalContract = new ethers.Contract(contractAddress, contractABI, signer);

        let count = await waveportalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());

        const waveTxn = await waveportalContract.wave(waveMessage, { gasLimit: 300000 })
        setMining(true);
        console.log("Mining...", waveTxn.hash);

        await waveTxn.wait();
        setMining(false);
        console.log("Mined -- ", waveTxn.hash);

        count = await waveportalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());

        window.location.reload(false);
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error)
    }
  }

  /*
  * This runs our function when the page loads.
  */
  useEffect(() => {
    console.log("isDarkMode: ", window.localStorage.getItem('isDarkMode'));
    checkIfWalletIsConnected();
  }, [])
  
  return (
    <div className="mainContainer">

      <ThemeProvider theme={isDarkMode ? darkTheme: lightTheme}>
        <>
          <GlobalStyles />
        </>
      </ThemeProvider>

      <div className="dataContainer">
        <DarkModeToggle
          onChange={() => {
            console.log("isDarkMode: ", isDarkMode);
            setIsDarkMode(isDarkMode ? false: true);
            console.log("isDarkMode: ", isDarkMode);
            window.localStorage.setItem('isDarkMode', isDarkMode)
            }
          }
          checked={isDarkMode}
          size={80}
        />

        <div className="header">
        💰Hey there!
        </div>

        <div className="bio">
        I am gonsan.
        Connect your Ethereum wallet and give me your money or GTFO!
        </div>

        {!currentAccount && (
          <button className="waveButton" onClick={connectWallet}>
            Connect Wallet
          </button>
        )}

        <form onSubmit={wave}>
          <input className="inputMessage" type="text" value={waveMessage} onChange={(e) => setWaveMessage(e.target.value)} />
        </form>

        <button className="waveButton" onClick={wave}>Wave at Me</button>

        {[...allWaves].reverse().map((wave, index) => {
          return (
            <div key={index} style={{ backgroundColor: "OldLace", marginTop: "16px", padding: "8px", color:"#363537"}}>
              <div>Address: {wave.address}</div>
              <div>Time: {wave.timestamp.toString()}</div>
              <div>Message: {wave.message}</div>
            </div>)
        })}

      </div>
    </div>
  );
}

export default App
