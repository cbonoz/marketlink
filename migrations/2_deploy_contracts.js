const MyContract = artifacts.require("MyContract");
const LinkTokenInterface = artifacts.require("LinkTokenInterface");

const linkTokenAddress = "0x20fE562d797A42Dcb3399062AE9546cd06f63280";

// weather
// const oracle = "0x4a3fbbb385b5efeb4bc84a25aaadcd644bd09721"
// const jobId = web3.utils.toHex("ca60ea1e28fb4f9586b336e3329517b8");

// https://honeycomb.market/
// body: {email}
// approxemployees:140
// city:"Boston"
// code:200
// country:"United States of America"
// domain:"drift.com"
// email:"elias@drift.com"
// founded:2014
// message:"OK"
// name:"Drift.com, Inc."
// postalcode:"02116"
// state:"Massachusetts"
// street:"222 Berkeley Street Suite 600"
// website:"https://www.drift.com/"
const oracle = "0x4a3fbbb385b5efeb4bc84a25aaadcd644bd09721"
const jobId = web3.utils.toHex("46226e68fc544bf499b2fd1f20c0b2b5");

const perCallLink = web3.utils.toWei("0.111");
const depositedLink = web3.utils.toWei("1");

module.exports = async function(deployer) {
  await deployer.deploy(
    MyContract,
    linkTokenAddress,
    oracle,
    jobId,
    perCallLink
  );
  const myContract = await MyContract.deployed();

  const linkToken = await LinkTokenInterface.at(linkTokenAddress);
  await linkToken.transfer(myContract.address, depositedLink);
};
