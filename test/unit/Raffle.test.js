const { assert, expect } = require("chai")
const { getNamedAccounts, deployments, ethers, network } = require("hardhat")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Raffle Unit Tests", function () {
          let raffle, vrfCoordinatorV2Mock, lotteryEntranceFee, deployer, interval
          const chainId = network.config.chainId

          beforeEach(async function () {
              const { deployer } = await getNamedAccounts()
              await deployments.fixture(["all"])
              raffle = await ethers.getContract("Raffle", deployer)
              vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock", deployer)
              raffleEntranceFee = await raffle.getEntranceFee()
              interval = await raffle.getInterval()
          })

          describe("constructor", async function () {
              it("Initializes the raffle correctly", async function () {
                  //   ideally we make our test have 1 "asserst" per "it"
                  const raffleState = await raffle.getRaffleState()
                  const interval = await raffle.getInterval()
                  assert.equal(raffleState.toString(), "0") //Raffle state == OPEN
                  assert.equal(interval.toString(), networkConfig[chainId]["interval"])
              })
          })
        })
          describe("enterRaffle", function () {
              it("reverts when you dont pay enough", async function () {
                  await expect(raffle.enterLottery()).to.be.revertedWith(
                      "error Raffle__SendMoreToEnterRaffle"
                  )
              })
              it("records players when they enter", async function () {
                  await raffle.enterRaffle({ value: raffleEntranceFee })
                  const playerFromContract = await raffle.getPlayer(0)
                  assert.equal(playerFromContract, deployer)
              })
              it("emits event on enter", async function () {
                  await expect(raffle.enterRaffle({ value: raffleEntranceFee })).to.emit(
                      raffle,
                      "RaffleEnter"
                  )
              })
              it("doesn't allow players to enter raffle when not OPEN", async function () {
                  await raffle.enterRaffle({ value: raffleEntranceFee })
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                  await network.provider.send("evm_mine", [])
                  //   await network.provider.request({method: "evm_mine", params: []})
                  await raffle.performUpkeep([])
                  await expect(
                      raffle.enterRaffle({ value: raffleEntranceFee })
                  ).to.be.revertedWith("Raffle__RaffleNotOpen")
              })
          })
          describe("checkUpkeep", function () {
              it("returns false if people havent send any Eth", async function () {
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                  await network.provider.send("evm_mine", [])
                  const { upkeepNeeded } = await raffle.callStatic.checkUpkeep([])
                  assert(!upkeepNeeded)
              })
              it("returns false if raffle isnt Open", async function () {
                  await raffle.enterRaffle({ value: raffleEntranceFee })
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                  await network.provider.request("evm_mine", [])
                  await raffle.performUpkeep([])
                  const raffleState = await raffle.getRaffleState()
                  const { upkeepNeeded } = await raffle.callStatic.checkUpkeep([])
                  assert.equal(raffleState.toString(), "1")
                  assert.equal(upkeepNeeded, false)
              })
              it("returns false if enough time hasnt passed", async function () {
                  await raffle.enterRaffle({ value: raffleEntranceFee })
                  await network.provider.send("evm_increaseTime", [interval.toNumber() - 1])
                  await network.provider.request({ method: "evm_mine", params: [] })
                  const { upkeepNeeded } = await raffle.callStatic.checkUpkeep("0x")
                  assert(!upkeepNeeded)
              })
              it("returns true if enough time has passed, has players, eth and is open", async function () {
                  await raffle.enterRaffle({ value: raffleEntranceFee })
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                  await network.provider.request({ method: "evm_mine", params: [] })
                  const { upkeepNeeded } = await raffle.callStatic.checkUpkeep("0x")
                  assert(upkeepNeeded)
              })
          })
          describe("performUpkeep", function () {
              it("it can only run if checkupkeep is true", async function () {
                  await raffle.enterRaffle({ value: raffleEntranceFee })
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                  await network.provider.request("evm_mine", [])
                  const tx = await raffle.performUpkeep([])
                  assert(tx)
              })
              it("reverts when checkupkeep is false", async function () {
                  await expect(raffle.performUpkeep([])).to.be.revertedWith(
                      "Raffle__UpkeepNotNeeded"
                  )
              })
              it("updates the raffle state emit, and event, and calls the vrf coordinator", async function () {
                  await raffle.enterRaffle({ value: raffleEntranceFee })
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                  await network.provider.send("evm_mine", [])
                  const txResponse = await raffle.performUpkeep([])
                  const txReceipt = await txResponse.wait(1)
                  const requestId = txReceipt.event[1].args.requestId
                  const raffleState = await raffle.getRaffleState()
                  assert(requestId.toNumber() > 0)
                  assert(raffleState.toString() == "1")
              })
          })
          describe("fullfillRandomWords", function () {
              beforeEach(async function () {
                  await raffle.enterRaffle({ value: raffleEntranceFee })
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                  await network.provider.send("evm_mine", [])
              })
              it("can only be called after performUpkeep", async function () {
                  await expect(
                      vrfCoordinatorV2Mock.fulfillRandomWords(0, raffle.address)
                  ).to.be.revertedWith("nonexistent request")
                  await expect(
                      vrfCoordinatorV2Mock.fulfillRandomWords(1, raffle.address)
                  ).to.be.revertedWith("nonexistent request")
              })
    //           //big test that puts everything together
    //           it("picks a winner, resets the lottery, and sends money", async function () {
    //               const additionalEntrants = 3
    //               const startingAccountIndex = 1 //deployer = 0
    //               const accounts = await ethers.getSigners()
    //               for (
    //                   let i = startingAccountIndex;
    //                   i < startingAccountIndex + additionalEntrants;
    //                   i++
    //               ) {
    //                   const accountConnectedLottery = lottery.connect(accounts[i])
    //                   await accountConnectedLottery.enterLottery({ value: lotteryEntranceFee })
    //               }
    //               const startingTimeStamp = await lottery.getLastTimeStamp()

    //               //performUpkeep (mock being chainglink keepers)
    //               //fullfillRandomWords(mock being the chainlink vrf
    //               //we will have to wait for the fulfillRandomWords to be called.
    //               await new Promise(async (resolve, reject) => {
    //                   lottery.once("WinnerPicked", async () => {
    //                       console.log("found the event")
    //                       try {
    //                           console.log(recentWinner)
    //                           //   console.log(accounts[2].address) // to identify which account won the lottery
    //                           //   console.log(accounts[1].address)
    //                           //   console.log(accounts[0].address)
    //                           //   console.log(accounts[3].address)
    //                           const recentWinner = await lottery.getRecentWinner()
    //                           const lotteryState = await lottery.getLotteryState()
    //                           const endingTimeStamp = await lottery.getLastTimeStamp()
    //                           const numPlayers = await lottery.getNumberOfPlayers()
    //                           const winnerEndingBalance = await account[1].getBalance()
    //                           assert.equal(numPlayers.toString(), "0") //to make sure no players in the lottery
    //                           assert.equal(lotteryState.toString(), "0") //to make sure lottery state is "open"
    //                           assert(endingTimeStamp > startingTimeStamp) //lasttimestamo should have been updated

    //                           assert.equal(
    //                               winnerEndingBalance.toString(),
    //                               winnerStartingBalance.add(
    //                                   lotteryEntranceFee
    //                                       .mul(additionalEntrants)
    //                                       .add(lotteryEntranceFee)
    //                                       .toString()
    //                               )
    //                           )
    //                       } catch (e) {
    //                           reject(e)
    //                       }
    //                       resolve()
    //                   })
    //                   const tx = await lottery.performUpkeep([])
    //                   const txReceipt = await tx.wait(1)
    //                   const winnerStartingBalance = await accounts[1].getBalance()
    //                   await vrfCoordinatorV2Mock.fulfillRandomWords(
    //                       txReceipt.events[1].args.chainId,
    //                       lottery.address
    //                   )
    //               })
    //           })
    //       })
    //   })
//123
//111