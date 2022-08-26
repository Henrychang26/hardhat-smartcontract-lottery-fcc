const { ethers } = require("hardhat")

const networkConfig = {
    default: {
        name: "hardhat",
        interval: "30",
    },
    31337: {
        name: "hardhat",
        subscriptionId: "588",
        gasLane: "0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc", // 30 gwei
        interval: "30",
        entranceFee: ethers.utils.parseEther("0.01"),
        callbackGasLimit: "500000", // 500,000 gas
    },
    4: {
        name: "rinkeby",
        subscriptionId: "19809",
        gasLane: "0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc", // 30 gwei
        interval: "30",
        entranceFee: ethers.utils.parseEther("0.01"),
        callbackGasLimit: "500000", // 500,000 gas
        vrfCoordinatorV2: "0x6168499c0cFfCaCD319c818142124B7A15E857ab",
    },
    1: {
        name: "mainnet",
        keepersUpdateInterval: "30",
    },
}

const developmentChains = ["hardhat", "localhost"]
// const VERIFICATION_BLOCK_CONFIRMATIONS = 6
// const frontEndContractsFile = "../nextjs-smartcontract-lottery-fcc/constants/contractAddresses.json"
// const frontEndAbiFile = "../nextjs-smartcontract-lottery-fcc/constants/abi.json"

module.exports = {
    networkConfig,
    developmentChains,
}
