const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");

describe("Recruitment contract", function () {
  async function deployRecruitmentFixture() {
    const [owner, addr1, addr2] = await ethers.getSigners();
    const Recruitment = await ethers.getContractFactory("Recruitment");
    const MinterMock = await ethers.getContractFactory('MinterMock', addr1.address);

    const rInstance = await Recruitment.deploy();
    const tInstance = await MinterMock.deploy();

    await rInstance.deployed();
    await tInstance.deployed();
    await tInstance.transfer(addr1.address, `1000000${"0".repeat(18)}`);

    await tInstance.connect(addr1).approve(
      rInstance.address,
      `1000${"0".repeat(18)}`
    );
    const DAI = ethers.utils.formatBytes32String('DAI');
    
    await rInstance.whitelistToken(
      DAI,
      tInstance.address,
      18
    );
    // Fixtures can return anything you consider useful for your tests
    return { rInstance, tInstance, owner, addr1, addr2, DAI };
  }

  it("Address 1 balance to be initialized at 1,000,000 DAI", async function () {
    const { rInstance, tInstance, owner, addr1, addr2, DAI } = await loadFixture(deployRecruitmentFixture);
    const addr1Balance = await tInstance.balanceOf(addr1.address);
    expect(addr1Balance).to.equal(`1000000${"0".repeat(18)}`);
  });

  it("DAI to be whitelisted from recruitment smart contract", async function () {
    const { rInstance, tInstance, owner, addr1, addr2, DAI } = await loadFixture(deployRecruitmentFixture);    
    const whitelistedAddress = await rInstance.getWhitelistedTokenAddresses(DAI);
    expect(whitelistedAddress).to.equal(tInstance.address);
    expect(whitelistedAddress).to.equal(tInstance.address);
  });

  it("DAI to be whitelisted with 18 decimals", async function () {
    const { rInstance, tInstance, owner, addr1, addr2, DAI } = await loadFixture(deployRecruitmentFixture);    
    const decimals = await rInstance.getWhitelistedTokenDecimals(DAI);
    expect(decimals).to.equal(18);
  });
  

  it("Recruitment balance to be 1000 DAI", async function () {
    const { rInstance, tInstance, owner, addr1, addr2, DAI } = await loadFixture(deployRecruitmentFixture);
    const rcpt = await rInstance.connect(addr1).setInitialDeposit(
      DAI,
      30,
      20
    );
    const rBalance = await rInstance.accountBalances(addr1.address, DAI);
    expect(rBalance).to.equal(`1000${"0".repeat(18)}`);
  });

  it("Initial deposit monthly refunds must be 30, 20 and 50", async function() {
    const { rInstance, tInstance, owner, addr1, addr2, DAI } = await loadFixture(deployRecruitmentFixture);
    await tInstance.connect(addr1).approve(
        rInstance.address,
        `2000${"0".repeat(18)}`
      );
    await rInstance.connect(addr1).setInitialDeposit(DAI,50,20);
    await rInstance.connect(addr1).setInitialDeposit(DAI,30,20);
    const percentages = await rInstance.connect(addr1.address).getAccountMonthlyRefundPcts();
    const lastAddedDepositPcts = percentages[percentages.length - 1];
    const month3Percentage = 100 - lastAddedDepositPcts[0] - lastAddedDepositPcts[1];
    expect(lastAddedDepositPcts[0]).to.equal(30);
    expect(lastAddedDepositPcts[1]).to.equal(20);
    expect(month3Percentage).to.equal(50);
  });

  it("Total deposits amount to 25,000 USD", async function() {
    const { rInstance, tInstance, owner, addr1, addr2, DAI } = await loadFixture(deployRecruitmentFixture);
    await tInstance.connect(addr1).approve(
        rInstance.address,
        `1000${"0".repeat(18)}`
      );
    await rInstance.connect(addr1).setInitialDeposit(DAI,50,20);
    await tInstance.connect(addr1).approve(
        rInstance.address,
        `24000${"0".repeat(18)}`
      );
    await rInstance.connect(addr1).setFinalDeposit(DAI,`24000${"0".repeat(18)}`,0);
    const rBalance = await rInstance.accountBalances(addr1.address, DAI);
    expect(rBalance).to.equal(`25000${"0".repeat(18)}`);
  });

  it("Account balances equals 15,000 after withdraw of 10,000", async function() {
    const { rInstance, tInstance, owner, addr1, addr2, DAI } = await loadFixture(deployRecruitmentFixture);
    await tInstance.connect(addr1).approve(
        rInstance.address,
        `1000${"0".repeat(18)}`
      );
    await rInstance.connect(addr1).setInitialDeposit(DAI,50,20);
    await tInstance.connect(addr1).approve(
        rInstance.address,
        `24000${"0".repeat(18)}`
      );
    await rInstance.connect(addr1).setFinalDeposit(DAI,`24000${"0".repeat(18)}`,0);
    await rInstance.connect(owner).withdrawTokens(DAI,`10000${"0".repeat(18)}`);
    const rBalance = await rInstance.accountBalances(addr1.address, DAI);
    expect(rBalance).to.equal(`15000${"0".repeat(18)}`);
  });

//   it("Final payment with wrong initial deposit index fails", async function() {
//     const { rInstance, tInstance, owner, addr1, addr2, DAI } = await loadFixture(deployRecruitmentFixture);
//     await tInstance.connect(addr1).approve(
//         rInstance.address,
//         `1000${"0".repeat(18)}`
//       );
//     await rInstance.connect(addr1).setInitialDeposit(DAI,50,20);
//     await tInstance.connect(addr1).approve(
//         rInstance.address,
//         `24000${"0".repeat(18)}`
//       );
//     expect(await rInstance.connect(addr1).setFinalDeposit(DAI,`24000${"0".repeat(18)}`,1)).to.revertedWith("Initial deposit index does not match!");
//   });
});