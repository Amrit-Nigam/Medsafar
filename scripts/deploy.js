const hre = require("hardhat");
async function main() {
  try {
    // Get the contract factory
    const SupplyChain = await hre.ethers.getContractFactory("SupplyChain");
    
    // Deploy the contract
    const supplyChain = await SupplyChain.deploy();
    
    // Wait for deployment to complete
    await supplyChain.waitForDeployment();
    
    // Get the deployed contract address
    const deployedAddress = await supplyChain.getAddress();
    
    console.log("SupplyChain deployed to:", deployedAddress);
  } catch (error) {
    console.error("Deployment failed:", error);
    process.exit(1);
  }
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });