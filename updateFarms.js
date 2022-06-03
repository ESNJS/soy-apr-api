const Web3 = require('web3-eth');
const jsonfile = require('jsonfile')

const web3 = new Web3('https://clo-geth.0xinfra.com/');

//GlobalFarm Contract
const globalFarmAddress = "0x64Fa36ACD0d13472FD786B03afC9C52aD5FCf023"
const lastAddedFarmIndexABI = {"type":"function","stateMutability":"view","outputs":[{"type":"uint256","name":"","internalType":"uint256"}],"name":"lastAddedFarmIndex","inputs":[]}
const localFarmsABI  = {"type":"function","stateMutability":"view","outputs":[{"type":"address","name":"farmAddress","internalType":"address"},{"type":"uint256","name":"multiplier","internalType":"uint256"},{"type":"uint256","name":"lastPayment","internalType":"uint256"}],"name":"localFarms","inputs":[{"type":"uint256","name":"","internalType":"uint256"}]}
const totalMultiplierABI = {"type":"function","stateMutability":"view","outputs":[{"type":"uint256","name":"","internalType":"uint256"}],"name":"totalMultipliers","inputs":[]}
const globalFarmContract = new web3.Contract([lastAddedFarmIndexABI, localFarmsABI, totalMultiplierABI], globalFarmAddress)

//LocalFarm Contract
const lpTokenABI = {"type":"function","stateMutability":"view","outputs":[{"type":"address","name":"","internalType":"contract IERC223"}],"name":"lpToken","inputs":[]}

//SOY-LP Contract
const token0ABI = {"type":"function","stateMutability":"view","payable":false,"outputs":[{"type":"address","name":"","internalType":"address"}],"name":"token0","inputs":[],"constant":true}
const token1ABI = {"type":"function","stateMutability":"view","payable":false,"outputs":[{"type":"address","name":"","internalType":"address"}],"name":"token1","inputs":[],"constant":true}

//ERC223/ERC20 Contract
const symbolABI = {"type":"function","stateMutability":"view","outputs":[{"type":"string","name":"","internalType":"string"}],"name":"symbol","inputs":[]}

//GlobalVariables
const yearlySoyReward = 136986*365

async function getTotalMultiplier() {
    return parseInt(await globalFarmContract.methods.totalMultipliers().call())
}

async function getlastAddedFarmIndex() {
    return await globalFarmContract.methods.lastAddedFarmIndex().call()
}

async function getlocalFarmLPToken(localFarmAddress) {
    let localFarmContract = new web3.Contract([lpTokenABI], localFarmAddress)
    return await localFarmContract.methods.lpToken().call()
}

async function getToken0(LPTokenAddress) {
    let LPTokenContract = new web3.Contract([token0ABI], LPTokenAddress)
    return await LPTokenContract.methods.token0().call()
}

async function getToken1(LPTokenAddress) {
    let LPTokenContract = new web3.Contract([token1ABI], LPTokenAddress)
    return await LPTokenContract.methods.token1().call()
}

async function getSymbol(tokenAddress) {
    let TokenContract = new web3.Contract([symbolABI], tokenAddress)
    return await TokenContract.methods.symbol().call()
}

async function hasMethod(contractAddress, signature) {
    const code = await web3.getCode(contractAddress);
    const functionSignature = web3.abi.encodeFunctionSignature(signature);
    // remove "0x" prefixed in 0x<4bytes-selector>
    return code.indexOf(functionSignature.slice(2, functionSignature.length)) > 0;
}

async function saveLocalFarmsInfo(amountOfFarms, totalMultipler) {
    let farmsInfo = {"farmsInfo": []}
    for (let i = 0; i <= amountOfFarms; i++){
        let res = await globalFarmContract.methods.localFarms(i).call()
        if(await hasMethod(res.farmAddress,"lpToken()")){
            let lpToken = await getlocalFarmLPToken(res.farmAddress)
            let token0 = await getToken0(lpToken)
            let token1 = await getToken1(lpToken)
            let symbol0 = await getSymbol(token0)
            let symbol1 = await getSymbol(token1)
            let multiplier = parseInt(res.multiplier)
            let weight = multiplier/totalMultipler
            
            farmsInfo['farmsInfo'].push({ 
                'pair': symbol0+"-"+symbol1, 
                'yearlysoyreward': weight*yearlySoyReward,
                'id': i, 
                'farm': res.farmAddress, 
                'multiplier': multiplier, 
                'weight': weight, 
                'lptoken': lpToken, 
                'token0': token0,
                'token1': token1,
                'symbol0': symbol0,
                'symbol1': symbol1
            })
        }
    }

    return farmsInfo
}

async function update (){
    let lastAddedFarmIndex = await getlastAddedFarmIndex()
    let farmsTotalMultipler = await getTotalMultiplier()
    
    let obj = await saveLocalFarmsInfo(lastAddedFarmIndex, farmsTotalMultipler)

    jsonfile.writeFile("./farmlist.json", obj, { spaces: 2 }, function (err) {
        if (err) console.error(err)
        console.log("File Updated");
    })

}

update()