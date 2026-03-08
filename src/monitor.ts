import { runWorkflow } from "../cre/workflow";
import { ethers } from "ethers";
import * as fs from "fs";
import * as path from "path";

async function simulate() {
    console.log("\n🚀 DEADMANSWITCH AI PROTOCOL SIMULATION STARTING...");

    // Configuration (prefers .env values)
    const RPC_URL = process.env.SEPOLIA_RPC_URL || "http://127.0.0.1:8545";
    const OWNER_PRIVATE_KEY = process.env.PRIVATE_KEY || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
    const AUTOMATION_PRIVATE_KEY = process.env.PRIVATE_KEY || "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";
    const HEIR_ADDRESS = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";

    // Read deployment info
    const deploymentPath = path.join(process.cwd(), "deployments.json");
    if (!fs.existsSync(deploymentPath)) {
        throw new Error("Deployments file not found. Please run the deployment script first.");
    }
    const deploymentInfo = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
    const VAULT_ADDRESS = deploymentInfo.address;

    console.log(`📡 Connected to Vault at: ${VAULT_ADDRESS}`);

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const owner = new ethers.Wallet(OWNER_PRIVATE_KEY, provider);
    const automation = new ethers.Wallet(AUTOMATION_PRIVATE_KEY, provider);

    const abi = [
        "function deposit() payable",
        "function registerHeir(address, uint256)",
        "function setAutomation(address)",
        "function ping()",
        "function executeInheritance()",
        "function lastPingTimestamp() view returns (uint256)",
        "function inactivityThreshold() view returns (uint256)"
    ];

    const vault = new ethers.Contract(VAULT_ADDRESS, abi, owner);

    console.log("💎 1. User deposits funds...");
    const depositTx = await vault.deposit({ value: ethers.parseEther("1.0") });
    await depositTx.wait();
    console.log("✅ Deposit successful (1.0 ETH)");

    console.log("👤 2. User registers heir (Threshold: 5 seconds)...");
    const regTx = await vault.registerHeir(HEIR_ADDRESS, 5);
    await regTx.wait();
    console.log(`✅ Heir registered: ${HEIR_ADDRESS}`);

    console.log("🤖 3. User sets automation registry...");
    const autoTx = await vault.setAutomation(automation.address);
    await autoTx.wait();
    console.log(`✅ Automation address set: ${automation.address}`);

    const startPing = await vault.lastPingTimestamp();
    console.log(`⏳ 4. User stops pinging. Last activity at: ${new Date(Number(startPing) * 1000).toLocaleTimeString()}`);
    console.log("Waiting for inactivity threshold (6 seconds)...");

    await new Promise(resolve => setTimeout(resolve, 6000));

    console.log("🔍 5. Monitoring System detects inactivity...");
    await runWorkflow(VAULT_ADDRESS, RPC_URL, AUTOMATION_PRIVATE_KEY);

    console.log("\n✨ --- SIMULATION COMPLETE --- ✨\n");
}

simulate().catch((error) => {
    console.error("❌ Simulation failed:", error.message);
    console.log("\nNote: Please ensure a local Hardhat node is running and the contract is deployed.");
});
