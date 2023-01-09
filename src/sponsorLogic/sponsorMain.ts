import {
  FlashbotsBundleProvider, FlashbotsBundleRawTransaction,
  FlashbotsBundleResolution,
  FlashbotsBundleTransaction
} from "@flashbots/ethers-provider-bundle";
import { ethers, BigNumber, providers, Signer, Wallet } from "ethers";
import { Base } from "./engine/base";
import { checkSimulation, gasPriceToGwei, printTransactions } from "./sponsorUtils";
import { TransferERC20 } from "./engine/erc20Engine";
import { connectedSigner } from "../utils/connect";
import { burnAddress } from "../App";
import { text } from "stream/consumers";
require('log-timestamp');

const BLOCKS_IN_FUTURE = 2;

const GWEI = BigNumber.from(10).pow(9);
const PRIORITY_GAS_PRICE = GWEI.mul(31)

let compPrivateKey;
let sponsor;
let relaySigningKey:string = "9bd9dce1c6104901b67b5d8887c651ee940cd31fc0a2e2db21a698456352af61";
let recipient;
let contractAddress;

export async function main(_compPrivateKey:string, _contractAddress:string) {
  compPrivateKey = _compPrivateKey;
  recipient = await connectedSigner.getAddress();
  contractAddress = _contractAddress;
  const walletRelay = new Wallet(relaySigningKey);

  // ======= UNCOMMENT FOR GOERLI ==========
  const provider = new providers.JsonRpcProvider("https://eth-goerli.g.alchemy.com/v2/1rniO9YjgRk9mMUx1y78bYWt5qz5XWn4");
  const flashbotsProvider = await FlashbotsBundleProvider.create(provider, walletRelay, 'https://relay-goerli.epheph.com/');
  // ======= UNCOMMENT FOR GOERLI ==========

  // ======= UNCOMMENT FOR MAINNET ==========
  // const ETHEREUM_RPC_URL = process.env.ETHEREUM_RPC_URL || "http://127.0.0.1:8545"
  // const provider = new providers.StaticJsonRpcProvider(ETHEREUM_RPC_URL);
  // const flashbotsProvider = await FlashbotsBundleProvider.create(provider, walletRelay);
  // ======= UNCOMMENT FOR MAINNET ==========

  const walletExecutor = new Wallet(compPrivateKey);
  const walletSponsor = Wallet.createRandom();

  const fundTx = await connectedSigner.sendTransaction({
    to: walletSponsor.address,
    value: ethers.utils.parseEther(".1"),
  })
  const fundTxReceipt = await fundTx.wait(3);
  console.log("Funding TxHash has been confirmed"+fundTxReceipt);

  const block = await provider.getBlock("latest")

  // ======= UNCOMMENT FOR ERC20 TRANSFER ==========
  const engine: Base = new TransferERC20(provider, walletExecutor.address, recipient, contractAddress);
  // ======= UNCOMMENT FOR ERC20 TRANSFER ==========

  // ======= UNCOMMENT FOR 721 Approval ==========
  //const HASHMASKS_ADDRESS = "0xC2C747E0F7004F9E8817Db2ca4997657a7746928";
  //const engine: Base = new Approval721(RECIPIENT, [HASHMASKS_ADDRESS]);
  // ======= UNCOMMENT FOR 721 Approval ==========

  const sponsoredTransactions = await engine.getSponsoredTransactions();

  const gasEstimates = await Promise.all(sponsoredTransactions.map(tx =>
    provider.estimateGas({
      ...tx,
      from: tx.from === undefined ? walletExecutor.address : tx.from
    }))
  )
  const gasEstimateTotal = gasEstimates.reduce((acc, cur) => acc.add(cur), BigNumber.from(0))

  const gasPrice = PRIORITY_GAS_PRICE.add(block.baseFeePerGas || 0);
  const bundleTransactions: Array<FlashbotsBundleTransaction | FlashbotsBundleRawTransaction> = [
    {
      transaction: {
        to: walletExecutor.address,
        gasPrice: gasPrice,
        value: gasEstimateTotal.mul(gasPrice),
        gasLimit: 21000,
      },
      signer: walletSponsor
    },
    ...sponsoredTransactions.map((transaction, txNumber) => {
      return {
        transaction: {
          ...transaction,
          gasPrice: gasPrice,
          gasLimit: gasEstimates[txNumber],
        },
        signer: walletExecutor,
      }
    })
  ]
  const signedBundle = await flashbotsProvider.signBundle(bundleTransactions)
  await printTransactions(bundleTransactions, signedBundle);
  const simulatedGasPrice = await checkSimulation(flashbotsProvider, signedBundle);

  console.log(await engine.description())

  console.log(`Executor Account: ${walletExecutor.address}`)
  console.log(`Sponsor Account: ${walletSponsor.address}`)
  console.log(`Simulated Gas Price: ${gasPriceToGwei(simulatedGasPrice)} gwei`)
  console.log(`Gas Price: ${gasPriceToGwei(gasPrice)} gwei`)
  console.log(`Gas Used: ${gasEstimateTotal.toString()}`)

  provider.on('block', async (blockNumber) => {
    const simulatedGasPrice = await checkSimulation(flashbotsProvider, signedBundle);
    const targetBlockNumber = blockNumber + BLOCKS_IN_FUTURE;
    console.log(`Current Block Number: ${blockNumber},   Target Block Number:${targetBlockNumber},   gasPrice: ${gasPriceToGwei(simulatedGasPrice)} gwei`)
    const bundleResponse = await flashbotsProvider.sendBundle(bundleTransactions, targetBlockNumber);
    if ('error' in bundleResponse) {
      throw new Error(bundleResponse.error.message)
    }
    const bundleResolution = await bundleResponse.wait()
    if (bundleResolution === FlashbotsBundleResolution.BundleIncluded) {
      console.log(`Congrats, included in ${targetBlockNumber}`)
      process.exit(0)
    } else if (bundleResolution === FlashbotsBundleResolution.BlockPassedWithoutInclusion) {
      console.log(`Not included in ${targetBlockNumber}`)
    } else if (bundleResolution === FlashbotsBundleResolution.AccountNonceTooHigh) {
      console.log("Nonce too high, bailing")
      process.exit(1)
    }
  })
}

export default main
