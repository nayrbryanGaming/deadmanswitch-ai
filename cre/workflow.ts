import { ethers } from "ethers";

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
