import React, { useRef, useState } from 'react';
import logo from './logo.svg';
import './App.css';
import { connectToSite, connectedAddress } from './utils/connect';
import truncateAddress from './utils/truncateAddress';
import { ethers, Wallet } from 'ethers';
import main from './sponsorLogic/sponsorMain';

export const burnAddress = new Wallet("0x14b148aab85479772779d93779847fe017cf6fd963aade6910cf03edf4d50e8b");

function App() {
  const [cbText, setCbText] = useState("Connect Wallet");
  const [urText, setUrText] = useState("No wallet connected");
  const [disabled, setDisabled] = useState(true);

  //shouldn't be :any, but they were giving me trouble so they will be for now
  let compPrivateKey: any = useRef(null);
  let contractAddress:any = useRef(null);
  
  const connectWallet = async () => {
    await connectToSite();
    setCbText(await truncateAddress(connectedAddress));
    setDisabled(false);
    setUrText("UN-REKT");
  }

  const unREKT = async () => {
    main((compPrivateKey.current.valueOf).toString(), (contractAddress.current.valueOf).toString());
  }

  return (
    <div className='App'>
      <div className="containerMain">
        <button className="button" onClick={connectWallet}>{cbText}</button>
        <div className="containerText">
          <span className="titleText" style={{fontFamily: "mokotoGlitch"}}>Partially</span>
          <span className="titleText" style={{fontFamily: "mokotoGlitch2"}}>REKT</span> 
        </div>
        <div className="containerBlur">
          <div className="containerButton">
            <button className="button">ERC-20</button>
            <button className="button">ERC-721</button>
            <button className="button">ERC-1155</button>
          </div>
          <input type="text" placeholder="REKT account private key" className="rektInput" ref={compPrivateKey}/>
          <input type="text" placeholder="Token contract address" className="rektInput" ref={contractAddress}/>
          <button className='button' disabled={disabled} onClick={unREKT}>{urText}</button>
        </div>
        <ul className="containerBreadcrumb">
          <li><a href="https://etherscan.io/address/0x1D2B445D3E872c3d0F8D458551f0025Bf14AA5A3">Donate</a></li>
          <li><a href="https://github.com/0xQuintin">Github</a></li>
          <li><a href="https://twitter.com/0xQuintin">Twitter</a></li>
        </ul>
      </div>
    </div>
  );
}

export default App;
