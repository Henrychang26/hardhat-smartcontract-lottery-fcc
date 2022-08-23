const { developmentChains } = require("../helper-hardhat-config")
const { network, deployments ,getNamedAccounts, ethers } = require("hardhat")

const BASE_FEE = ethers.utils.parseEther("0.25")
const GAS_PRICE_LINK = 1e9
//calculateed value based on the gas price of the chain.
//chainlink nodes pay the gas fee to give randomness and do external execution

module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId

    if (chainId === 31337) {
        log("local network detected! Deploying mocks...")
        //deploy a mock vrfcoordinator...
        await deploy("VRFCoordinatorV2Mock", {
            from: deployer,
            log: true,
            args: [BASE_FEE, GAS_PRICE_LINK],
        })
        log("Mocks Deployed")
        log("--------------------")
    }
}

module.exports.tags = ["all", "mocks"]
