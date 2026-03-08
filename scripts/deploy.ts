import { ethers, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
    console.log(`Deploying InheritanceVault to ${network.name}...`);

    const [deployer] = await ethers.getSigners();
    console.log(`Deployer address: ${deployer.address}`);

    const balance = await ethers.provider.getBalance(deployer.address);
    console.log(`Deployer balance: ${ethers.formatEther(balance)} ETH`);

    if (balance === 0n) {
        throw new Error("Deployer has 0 ETH. Please fund the wallet first.");
    }

    const InheritanceVault = await ethers.getContractFactory("InheritanceVault");
    const vault = await InheritanceVault.deploy();

    await vault.waitForDeployment();
    const vaultAddress = await vault.getAddress();

    console.log(`InheritanceVault deployed to: ${vaultAddress}`);

    // Save deployment info for the monitoring service
    const deploymentInfo = {
        network: network.name,
        address: vaultAddress,
        deployer: deployer.address,
        timestamp: new Date().toISOString()
    };

    const deploymentPath = path.join(process.cwd(), "deployments.json");
    fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
    console.log(`Deployment info saved to ${deploymentPath}`);

    // Update frontend contract address
    const frontendConfigPath = path.join(process.cwd(), "deadmanswitch-ui", "src", "lib", "contract.ts");
    if (fs.existsSync(frontendConfigPath)) {
        let content = fs.readFileSync(frontendConfigPath, "utf8");
        content = content.replace(
            /export const CONTRACT_ADDRESS = process\.env\.NEXT_PUBLIC_VAULT_ADDRESS \|\| '.*?';/,
            `export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_VAULT_ADDRESS || '${vaultAddress}';`
        );
        fs.writeFileSync(frontendConfigPath, content);
        console.log(`Frontend contract address updated to ${vaultAddress}`);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
