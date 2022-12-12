const Namehash = require("eth-ens-namehash-ms");
const secret = require("../secret.json");
const fs = require('fs');
const path = require('path');
const abi_path = "../artifacts/build-info";

async function main() {
  console.log(Namehash.hash("laokas.eth"));
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  const EnsRegistryMock = await ethers.getContractFactory("EnsRegistryMock");
  const EnsResolverMock = await ethers.getContractFactory("EnsResolverMock");
  const EnsSubdomainFactory = await ethers.getContractFactory("EnsSubdomainFactory");

  const ensRegistryMockInstance = await EnsRegistryMock.deploy();
  const ensResolverMockInstance = await EnsResolverMock.deploy();

  console.log("EnsRegistryMock address:", ensRegistryMockInstance.address); 
  console.log("EnsResolverMock address:", ensResolverMockInstance.address);

  const ensSubdomainFactoryInstance = await EnsSubdomainFactory.deploy(ensRegistryMockInstance.address, ensResolverMockInstance.address)
  console.log("EnsSubdomainFactory address:", ensSubdomainFactoryInstance.address);

  let receipt = await ensRegistryMockInstance.setOwner(Namehash.hash("laokas.eth"), ensSubdomainFactoryInstance.address);
  console.log("setOwner receipt", receipt);

  receipt = await ensRegistryMockInstance.owner(Namehash.hash("laokas.eth"));
  console.log("owner receipt", receipt);

  
  await updateContractAddresses(ensSubdomainFactoryInstance);
	await updateABIS();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

async function updateContractAddresses(factoryInstance) {
  let filePath = secret.webProjectPath + '/src/contract-addresses.json';
  var currentAddresses = JSON.parse(fs.readFileSync(filePath, 'utf8') ?? "{}");
  let newAddresses = {
    EnsSubdomainFactory: typeof factoryInstance === 'undefined' ? currentAddresses.EnsSubdomainFactory : factoryInstance.address
  };
  fs.writeFileSync(secret.webProjectPath + '/src/contract-addresses.json', JSON.stringify(newAddresses));
  console.log(`...updated contract address file at ${secret.webProjectPath}/src/contract-addresses.json`);
}

async function updateABIS() {
  let abis_folder = secret.webProjectPath + '/src',
  abiFileName = fs.readdirSync(path.resolve(__dirname, abi_path))[0];
  if (!abiFileName)
    throw new Error("no abi build exists!");
  fs.writeFileSync(`${abis_folder}/abi.json`, JSON.stringify(require(`${abi_path}/${abiFileName}`)));
  console.log(`...updated abi file at ${abis_folder}/abi.json`);
}


