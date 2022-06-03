'use strict';
const express = require('express');
const Web3 = require('web3-eth');
const Utils = require('web3-utils')
const axios = require('axios');
const jsonfile = require('jsonfile')
const serverless = require('serverless-http');
const app = express();
const bodyParser = require('body-parser');

const router = express.Router();

const web3 = new Web3('https://clo-geth.0xinfra.com/');

//SOY-LP Contract
const getReservesABI = {"type":"function","stateMutability":"view","payable":false,"outputs":[{"type":"uint112","name":"_reserve0","internalType":"uint112"},{"type":"uint112","name":"_reserve1","internalType":"uint112"},{"type":"uint32","name":"_blockTimestampLast","internalType":"uint32"}],"name":"getReserves","inputs":[],"constant":true}

//GlobalVariables
let priceList = {}
const coinGeckoApiIDs = {
    'SOY': 'soy-finance',
    'WCLO': 'callisto',
    'CLOE': false,
    'BUSDT': 'tether',
    'ccETC': 'ethereum-classic',
    'ccETH': 'ethereum',
    'ccBNB': 'binancecoin',
    'ccCake': 'pancakeswap-token',
    'ccTWT': 'trust-wallet-token',
    'ccWSG': 'wall-street-games',
    'ccREEF': 'reef-finance',
    'ccBAKE': 'bakerytoken',
    'ccSHIBA': 'shiba-inu',
    'ccRACA': 'radio-caca',
    'ccLINA': 'linear',
    'ccTONCOIN': false,
    'ccXMS': 'mars-ecosystem-token',
    'ccBTT': 'bittorrent',
    'ccFTM': 'fantom',
    'ccANTEX': 'antex',
    'ccZoo': 'zoo-crypto-world',
    'ccBCOIN': 'bomber-coin',
    'ccBBT': 'bitbook-token'
}

async function getReserves(LPTokenAddress) {
    let LPTokenContract = new web3.Contract([getReservesABI], LPTokenAddress)
    return await LPTokenContract.methods.getReserves().call()
}

async function listFarmsAPR(farmList) {

    for (let property in coinGeckoApiIDs) {
        await getPrice(`${property}`);
    }

    let farmsAPR = {"farmsAPR": []}

    for (let farm in farmList) {
        let reserves = await getReserves(farmList[farm].lptoken)
        let liquidityUSD = priceList[farmList[farm].symbol0]*Utils.fromWei(reserves._reserve0,"ether") + priceList[farmList[farm].symbol1]*Utils.fromWei(reserves._reserve1,"ether")
        let staking_APR = priceList['SOY']*farmList[farm].yearlysoyreward/liquidityUSD*100
        farmsAPR['farmsAPR'].push({ 
            'pair': farmList[farm].symbol0+"-"+farmList[farm].symbol1, 
            'apr': staking_APR
        })
    }

    return farmsAPR
}

async function getPrice(tokenSymbol){
    if(coinGeckoApiIDs[tokenSymbol]){
        await axios
        .get('https://api.coingecko.com/api/v3/coins/'+coinGeckoApiIDs[tokenSymbol])
        .then(res => {
          //console.log(`statusCode: ${res.status}`);
          setPrice(tokenSymbol, res.data.market_data.current_price.usd);
        })
        .catch(error => {
          console.error(error);
        });
    }else{
        setPrice(tokenSymbol, 0);
    }
}

function setPrice (symbol, price) {
    priceList[symbol] = price
}




router.get('/',  (req, res) => {
    jsonfile.readFile("./farmlist.json", async function (err, obj) {
        if (err) console.error(err)

        let list = await listFarmsAPR(obj.farmsInfo)
        res.send(list)
    })
});

app.use(bodyParser.json());
app.use('/.netlify/functions/server', router);  // path must route to lambda

module.exports = app;
module.exports.handler = serverless(app);
