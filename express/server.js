'use strict';
const express = require('express');
const path = require('path');
const serverless = require('serverless-http');
const app = express();
const bodyParser = require('body-parser');

const router = express.Router();

var Contract = require('web3-eth-contract');
Contract.setProvider('https://clo-geth.0xinfra.com/');


const contract = new Contract(
    [
        {
            "type":"function",
            "stateMutability":"view",
            "outputs":
                [
                    {
                        "type":"uint256",
                        "name":"",
                        "internalType":"uint256"
                    }
                ],
            "name":"balanceOf",
            "inputs":
                [
                    {
                        "type":"address",
                        "name":"account",
                        "internalType":"address"
                    }
                ]
        },
        {
            "type":"function",
            "stateMutability":"view",
            "outputs":
                [
                    {
                        "type":"uint256",
                        "name":"",
                        "internalType":"uint256"
                    }
                ],
            "name":"totalSupply",
            "inputs":[]
        }
    ], 
    '0x9FaE2529863bD691B4A7171bDfCf33C7ebB10a65'
)

router.get('/circulating',  (req, res) => {
    contract.methods.totalSupply().call((error, totalSupply) => {
        if(error) console.log(error);
        contract.methods.balanceOf("0xdEad000000000000000000000000000000000000").call((error, deadWalletBalance) => {
            if(error) console.log(error);
            contract.methods.balanceOf("0x67c20e815D9016CfE04e905A409D276BF1f52b67").call((error, treasuryBalance) => {
                if(error) console.log(error);
                contract.methods.balanceOf("0xEbBDd505bA4E6CaD0C17ccd5cbd88CBA073Fe934").call((error, idoBalance) => {
                  if(error) console.log(error);
                    res.send(((parseInt(totalSupply) - parseInt(deadWalletBalance) - parseInt(treasuryBalance) - parseInt(idoBalance))/10**18).toString())
                })
            })
        })

      })
});

router.get('/total',  (req, res) => {
    contract.methods.totalSupply().call((error, totalSupply) => {
        if(error) console.log(error);
        res.send((parseInt(totalSupply)/10**18).toString())
    })
});

router.get('/burned',  (req, res) => {
    contract.methods.balanceOf("0xdEad000000000000000000000000000000000000").call((error, deadWalletBalance) => {
        if(error) console.log(error);
        res.send((parseInt(deadWalletBalance)/10**18).toString())
    })
});

router.get('/',  (req, res) => {
  res.send(
      "<h1>How to use this API</h1>"+
      "Use <b>/total</b> to get Total Supply of SOY.<br/>"+
      "Use <b>/circulating</b> to get Circulating Supply of SOY.<br/>"+
      "Use <b>/burned</b> to get Burned Amount of SOY."
  )
});

app.use(bodyParser.json());
app.use('/.netlify/functions/server', router);  // path must route to lambda

module.exports = app;
module.exports.handler = serverless(app);
