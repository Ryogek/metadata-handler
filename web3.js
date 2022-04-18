const Web3 = require ('web3');
require('dotenv').config();
const fs = require('fs');

/*declaring env path for Web3 purposes*/
let scanlink = process.env.WEB3_SCANLINK;
let contractAddress = process.env.WEB3_CONTRACT_ADDRESS;

const provider = new Web3.providers.HttpProvider(scanlink);

const web3 = new Web3(provider);

module.exports = { web3 };

