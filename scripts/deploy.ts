import { ethers, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
    console.log(`Deploying InheritanceVault to ${network.name}...`);

    const InheritanceVault = await ethers.getContractFactory("InheritanceVault");
    const vault = await InheritanceVault.deploy();

    await vault.waitForDeployment();
    const vaultAddress = await vault.getAddress();

    console.log(`InheritanceVault deployed to: ${vaultAddress}`);

    // Save deployment info for the monitoring service
    const deploymentInfo = {
        network: network.name,
        address: vaultAddress,
        timestamp: new Date().toISOString()
    };

    const deploymentPath = path.join(process.cwd(), "deployments.json");
    fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
    console.log(`Deployment info saved to ${deploymentPath}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
