import * as dotenv from "dotenv";
import { ethers } from "ethers";

dotenv.config();

/**
 * DEADMANSWITCH AI – Chainlink CRE Workflow
 * Monitors Activity and Triggers Inheritance execution.
 */

export async function runWorkflow(contractAddress: string, providerUrl: string, automationKey: string) {
    console.log("CRE workflow started");

    const provider = new ethers.JsonRpcProvider(providerUrl);
    const wallet = new ethers.Wallet(automationKey, provider);

    const abi = [
        "function lastPingTimestamp() view returns (uint256)",
        "function inactivityThreshold() view returns (uint256)",
        "function executeInheritance() external"
    ];

    const contract = new ethers.Contract(contractAddress, abi, wallet);

    try {
        console.log("Checking wallet activity...");
        const lastPing = await contract.lastPingTimestamp();
        const threshold = await contract.inactivityThreshold();
        const currentTime = Math.floor(Date.now() / 1000);

        const inactivityPeriod = currentTime - Number(lastPing);

        if (inactivityPeriod > Number(threshold)) {
            console.log("Inactivity detected");
            console.log("Executing inheritance transfer...");

            const tx = await contract.executeInheritance();
            await tx.wait();

            console.log("Transfer successful");
        } else {
            console.log("Owner is active. No action needed.");
        }
    } catch (error) {
        console.error("Workflow failed:", error);
    }
}

// Standalone execution support
const isMain = require.main === module || (typeof process !== 'undefined' && process.argv[1]?.includes('workflow'));

if (isMain) {
    const contractAddress = process.env.VAULT_ADDRESS || "";
    const providerUrl = process.env.BASE_SEPOLIA_RPC_URL || process.env.SEPOLIA_RPC_URL || "http://127.0.0.1:8545";
    const automationKey = process.env.AUTOMATION_PRIVATE_KEY || process.env.PRIVATE_KEY || "";

    if (!contractAddress) {
        console.error("Error: VAULT_ADDRESS not set in .env");
        process.exit(1);
    }
    if (!automationKey) {
        console.error("Error: AUTOMATION_PRIVATE_KEY or PRIVATE_KEY not set in .env");
        process.exit(1);
    }

    runWorkflow(contractAddress, providerUrl, automationKey).catch((error) => {
        console.error("Fatal workflow error:", error.message);
        process.exit(1);
    });
}
