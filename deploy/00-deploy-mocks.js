const { developmentChains } = require("../helper-hardhat-config")
const { network, deployments ,getNamedAccounts, ethers } = require("hardhat")

const BASE_FEE = ethers.utils.parseEther("0.25") //0.25 is the premium-it cost 0.25 Link per request
const GAS_PRICE_LINK = 1e9
//calculateed value based on the gas price of the chain.
//chainlink nodes pay the gas fee to give randomness and do external execution

module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const args = [BASE_FEE, GAS_PRICE_LINK]

    if (developmentChains.includes(network.name)) {
        log("local network detected! Deploying mocks...")
        //deploy a mock vrfcoordinator...
        await deploy("VRFCoordinatorV2Mock", {
            from: deployer,
            log: true,
            args: args,
        })
        log("Mocks Deployed")
        log("--------------------")
    }
}

module.exports.tags = ["all", "mocks"]
