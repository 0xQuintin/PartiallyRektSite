import { ethers, providers, Signer } from "ethers";
declare let window:any;

export let connectedSigner:providers.JsonRpcSigner;
export let isConnected:boolean = false;
export let connectedAddress:string;

export const connectToSite = async () => {

    const connectionProvider = new ethers.providers.Web3Provider(window.ethereum);
    await connectionProvider.send("eth_requestAccounts", []);
    const signer = connectionProvider.getSigner();
    connectedSigner = signer;
    console.log(await connectedSigner.getAddress());
    isConnected = true;
    connectedAddress = await connectedSigner.getAddress();

}

export default connectToSite;