require("@nomicfoundation/hardhat-toolbox");
const secret = require("./secret.json");
// Go to https://www.alchemyapi.io, sign up, create
// a new App in its dashboard, and replace "KEY" with its key

module.exports = {
  solidity: "0.8.17",
  networks: {
    goerli: {
      url: secret.alchemyHost,
      accounts: [secret.privateKey],
      //timeout: 60000
    }
  }
};