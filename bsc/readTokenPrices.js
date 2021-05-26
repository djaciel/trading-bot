require('dotenv').config();
const express = require('express');
const http = require('http');
const Web3 = require('web3');
const HDWalletProvider = require('@truffle/hdwallet-provider');
const _ = require('lodash');

const { bscConstants: bscConstants } = require('./bscConstanst');
const PCWR_ABI = require('./abis/pancakeswapRouterAbi');

// SERVER CONFIG
const PORT = process.env.PORT || 5000;
const app = express();
const server = http
  .createServer(app)
  .listen(PORT, () => console.log(`Listening on ${PORT}`));

// WEB3 CONFIG
const web3 = new Web3(
  new HDWalletProvider(process.env.PRIVATE_KEY, bscConstants.BSC_RPC)
);
const BN = web3.utils.BN;
// BSC testnet PancakeSwap Router Contract
const pcsrContract = new web3.eth.Contract(
  PCWR_ABI,
  bscConstants.PANCAKESWAP_ROUTER
);

let priceMonitor;
let monitoringPrice = false;

async function monitorPrice() {
  if (monitoringPrice) {
    return;
  }

  console.log('Checking price...');
  monitoringPrice = true;

  pcsrContract.methods
    .getAmountsOut('1000000000000000000', [
      bscConstants.WBNB_ADDRESS,
      bscConstants.BUSD_ADDRESS,
    ])
    .call()
    .then((res) => {
      const price = web3.utils.fromWei(res[1], 'Ether');
      console.log('WBNB Price:', price, ' BUSD');
    })
    .catch((error) => {
      console.error(error);
      monitoringPrice = false;
      clearInterval(priceMonitor);
      return;
    });

  monitoringPrice = false;
}

// Check markets every n seconds
const POLLING_INTERVAL = process.env.POLLING_INTERVAL || 1000; // 1 Second
priceMonitor = setInterval(async () => {
  await monitorPrice();
}, POLLING_INTERVAL);
