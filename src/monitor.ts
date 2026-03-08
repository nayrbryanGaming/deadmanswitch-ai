import * as dotenv from "dotenv";
import { runWorkflow } from "../cre/workflow";
import { ethers } from "ethers";
import * as fs from "fs";
import * as path from "path";

dotenv.config();

async function simulate() {
    console.log("\n🚀 DEADMANSWITCH AI PROTOCOL SIMULATION STARTING...");

    // Configuration – all sensitive values MUST come from .env
    const RPC_URL = process.env.BASE_SEPOLIA_RPC_URL || process.env.SEPOLIA_RPC_URL || "http://127.0.0.1:8545";
    const OWNER_PRIVATE_KEY = process.env.PRIVATE_KEY;
    const AUTOMATION_PRIVATE_KEY = process.env.AUTOMATION_PRIVATE_KEY || process.env.PRIVATE_KEY;
    const HEIR_ADDRESS = process.env.HEIR_ADDRESS || "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"; // safe hardhat test addr

    if (!OWNER_PRIVATE_KEY) throw new Error("PRIVATE_KEY not set in .env");
    if (!AUTOMATION_PRIVATE_KEY) throw new Error("AUTOMATION_PRIVATE_KEY or PRIVATE_KEY not set in .env");

    // Read deployment info
    const deploymentPath = path.join(process.cwd(), "deployments.json");
    if (!fs.existsSync(deploymentPath)) {
        throw new Error("Deployments file not found. Please run the deployment script first.");
    }
    const deploymentInfo = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
    const VAULT_ADDRESS = deploymentInfo.address;

    console.log(`📡 Connected to Vault at: ${VAULT_ADDRESS}`);

    const provider = new ethers.JsonRpcProvider(RPC_URL);

    // ── Verify network before any transaction ────────────────
    const network = await provider.getNetwork();
    console.log(`🌐 Network: ${network.name} (chainId: ${network.chainId})`);
    const isLocal = RPC_URL.includes("127.0.0.1") || RPC_URL.includes("localhost");
    if (!isLocal && network.chainId !== 84532n && network.chainId !== 11155111n) {
        throw new Error(`Unexpected chainId ${network.chainId}. Expected Base Sepolia (84532) or Sepolia (11155111). Aborting.`);
    }

    const owner = new ethers.Wallet(OWNER_PRIVATE_KEY, provider);
    const automation = new ethers.Wallet(AUTOMATION_PRIVATE_KEY, provider);

    const ownerBal = await provider.getBalance(owner.address);
    console.log(`💳 Owner balance: ${ethers.formatEther(ownerBal)} ETH`);

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
    const depositReceipt = await depositTx.wait();
    if (!depositReceipt || depositReceipt.status === 0) throw new Error("Deposit transaction reverted on-chain");
    console.log(`✅ Deposit successful (1.0 ETH) | Gas used: ${depositReceipt.gasUsed} | Tx: ${depositTx.hash}`);

    console.log("👤 2. User registers heir (Threshold: 5 seconds)...");
    const regTx = await vault.registerHeir(HEIR_ADDRESS, 5);
    const regReceipt = await regTx.wait();
    if (!regReceipt || regReceipt.status === 0) throw new Error("registerHeir transaction reverted on-chain");
    console.log(`✅ Heir registered: ${HEIR_ADDRESS} | Gas used: ${regReceipt.gasUsed}`);

    console.log("🤖 3. User sets automation registry...");
    const autoTx = await vault.setAutomation(automation.address);
    const autoReceipt = await autoTx.wait();
    if (!autoReceipt || autoReceipt.status === 0) throw new Error("setAutomation transaction reverted on-chain");
    console.log(`✅ Automation address set: ${automation.address} | Gas used: ${autoReceipt.gasUsed}`);

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
