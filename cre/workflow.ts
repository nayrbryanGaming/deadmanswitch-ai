import * as dotenv from "dotenv";
import { ethers } from "ethers";

dotenv.config();

// ============================================================
// DEADMANSWITCH AI – Chainlink CRE Workflow (Production Grade)
// Features:
//  • Exponential-backoff retry on all RPC calls
//  • Pre-flight checks (heir set, balance > 0, threshold truly exceeded)
//  • Gas price guard (abort if network is too expensive)
//  • Gas estimation pre-simulation (detect revert BEFORE sending tx)
//  • Receipt status verification (detect silent on-chain revert)
//  • Automation wallet authorization check
//  • Structured timestamped logging (API keys redacted)
//  • Watch mode (continuous polling via --watch flag)
// ============================================================

// ── Configuration ──────────────────────────────────────────
const MAX_RETRIES          = 3;
const BASE_RETRY_DELAY_MS  = 2_000;  // doubles each attempt
const POLL_INTERVAL_MS     = 60_000; // watch-mode poll interval (60s)
const TIMESTAMP_BUFFER_S   = 5;      // extra seconds buffer vs block timestamp lag
const MAX_GAS_PRICE_GWEI   = 50;     // refuse execution above this gas price

// ── Minimal ABI for CRE workflow ───────────────────────────
const CONTRACT_ABI = [
    "function getStatus() view returns (address owner, address heir, uint256 lastPing, uint256 threshold, uint256 balance)",
    "function automationRegistry() view returns (address)",
    "function executeInheritance() external",
    "event InheritanceExecuted(address indexed heir, uint256 amount)",
];

// ── Types ──────────────────────────────────────────────────
export interface WorkflowConfig {
    contractAddress: string;
    providerUrl: string;
    automationKey: string;
}

interface PreflightResult {
    shouldExecute: boolean;
    reason: string;
    inactivityPeriod?: number;
    threshold?: number;
    balance?: string;
}

// ── Structured Logger ──────────────────────────────────────
function log(level: "INFO" | "WARN" | "ERROR" | "SUCCESS", msg: string): void {
    const ts   = new Date().toISOString();
    const icon = { INFO: "ℹ", WARN: "⚠", ERROR: "✗", SUCCESS: "✓" }[level];
    console.log(`[${ts}] [${level}] ${icon}  ${msg}`);
}

// ── Exponential-Backoff Retry ──────────────────────────────
async function withRetry<T>(fn: () => Promise<T>, label: string, maxRetries = MAX_RETRIES): Promise<T> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (err: any) {
            if (attempt === maxRetries) {
                log("ERROR", `${label} failed after ${maxRetries} attempts: ${err.message}`);
                throw err;
            }
            const delay = BASE_RETRY_DELAY_MS * Math.pow(2, attempt - 1);
            log("WARN", `${label} attempt ${attempt}/${maxRetries} failed — retrying in ${delay}ms…`);
            await new Promise(r => setTimeout(r, delay));
        }
    }
    throw new Error("Unreachable");
}

// ── Revert Reason Decoder ──────────────────────────────────
function parseRevertReason(error: any): string {
    if (error?.reason)             return error.reason;
    if (error?.data?.message)      return error.data.message;
    if (error?.error?.message)     return error.error.message;
    const msg: string = error?.message || String(error);
    const m1 = msg.match(/reason string '([^']+)'/);
    if (m1) return m1[1];
    const m2 = msg.match(/execution reverted: (.+?)(?:\n|$)/i);
    if (m2) return m2[1];
    return msg;
}

// ── Pre-flight Check ───────────────────────────────────────
async function preflight(contract: ethers.Contract): Promise<PreflightResult> {
    const [owner, heir, lastPing, threshold, balance] = await withRetry(
        () => contract.getStatus(),
        "preflight:getStatus"
    );

    log("INFO", `Vault → Owner: ${owner.slice(0,10)}…  Heir: ${heir === ethers.ZeroAddress ? "NOT SET" : heir.slice(0,10) + "…"}  Balance: ${ethers.formatEther(balance)} ETH  Threshold: ${Number(threshold)}s`);

    if (heir === ethers.ZeroAddress) {
        return { shouldExecute: false, reason: "No heir registered — skipping execution" };
    }

    if (BigInt(balance) === 0n) {
        return { shouldExecute: false, reason: "Vault balance is 0 — nothing to transfer, skipping" };
    }

    const now              = Math.floor(Date.now() / 1000);
    const inactivityPeriod = now - Number(lastPing);
    const thresholdNum     = Number(threshold);

    log("INFO", `Activity → Inactive for ${inactivityPeriod}s | Threshold ${thresholdNum}s | Remaining: ${Math.max(0, thresholdNum - inactivityPeriod)}s`);

    // Buffer prevents race condition between JS Date and block.timestamp
    if (inactivityPeriod < thresholdNum + TIMESTAMP_BUFFER_S) {
        const remaining = thresholdNum - inactivityPeriod;
        return {
            shouldExecute: false,
            reason: remaining > 0
                ? `Owner still active — ${remaining}s before threshold`
                : `Threshold just reached — waiting ${TIMESTAMP_BUFFER_S}s buffer for block confirmation`,
            inactivityPeriod,
            threshold: thresholdNum,
        };
    }

    return {
        shouldExecute: true,
        reason: "INACTIVITY THRESHOLD EXCEEDED — ready to execute inheritance",
        inactivityPeriod,
        threshold: thresholdNum,
        balance: ethers.formatEther(balance),
    };
}

// ── Guarded Execution ──────────────────────────────────────
async function executeWithGuards(
    contract:  ethers.Contract,
    provider:  ethers.Provider,
    walletAddr: string
): Promise<void> {
    // 1. Gas price guard
    const feeData   = await withRetry(() => provider.getFeeData(), "getFeeData");
    const gasPriceGwei = feeData.gasPrice
        ? Number(ethers.formatUnits(feeData.gasPrice, "gwei"))
        : 0;
    log("INFO", `Gas price: ${gasPriceGwei.toFixed(2)} gwei`);

    if (gasPriceGwei > MAX_GAS_PRICE_GWEI) {
        throw new Error(
            `Gas price ${gasPriceGwei.toFixed(2)} gwei exceeds maximum ${MAX_GAS_PRICE_GWEI} gwei — ` +
            `aborting to protect automation wallet funds. Try again when network is less congested.`
        );
    }

    // 2. Dry-run estimation — detect on-chain revert BEFORE spending gas
    let gasEstimate: bigint;
    try {
        gasEstimate = await contract.executeInheritance.estimateGas();
        log("INFO", `Gas estimate: ${gasEstimate.toString()} units`);
    } catch (err: any) {
        throw new Error(`Pre-execution simulation reverted: ${parseRevertReason(err)} — tx NOT sent`);
    }

    // 3. Send with 20% gas buffer
    const gasLimit = (gasEstimate * 120n) / 100n;
    log("INFO", `Submitting executeInheritance… (gasLimit: ${gasLimit})`);

    const tx = await withRetry(
        () => contract.executeInheritance({ gasLimit }),
        "executeInheritance"
    );
    log("INFO", `Transaction submitted: ${tx.hash}`);
    log("INFO", "Waiting for on-chain confirmation…");

    const receipt = await tx.wait();

    // 4. Receipt status check — 0 = reverted on-chain
    if (!receipt || receipt.status === 0) {
        throw new Error(`Transaction was mined but REVERTED on-chain. Hash: ${tx.hash}`);
    }

    log("SUCCESS", `✅ Inheritance executed! Hash: ${tx.hash} | Gas used: ${receipt.gasUsed} | Block: ${receipt.blockNumber}`);
}

// ── Main Workflow ──────────────────────────────────────────
/**
 * RunWorkflow — backward-compatible overload.
 * Accepts either (config) or (address, providerUrl, automationKey).
 */
export async function runWorkflow(
    configOrAddress: WorkflowConfig | string,
    providerUrl?: string,
    automationKey?: string
): Promise<void> {
    const cfg: WorkflowConfig =
        typeof configOrAddress === "string"
            ? { contractAddress: configOrAddress, providerUrl: providerUrl!, automationKey: automationKey! }
            : configOrAddress;

    log("INFO", "════════════════════════════════════════");
    log("INFO", "DEADMANSWITCH AI — CRE Workflow Starting");
    log("INFO", "════════════════════════════════════════");

    // Redact API key from log output (e.g. Alchemy /v2/<key>)
    const safeUrl = cfg.providerUrl.replace(/(\/v2\/)[^ ]+/, "$1[REDACTED]");
    log("INFO", `Contract : ${cfg.contractAddress}`);
    log("INFO", `Provider : ${safeUrl}`);

    // ── Connect ────────────────────────────────────────────
    const provider = new ethers.JsonRpcProvider(cfg.providerUrl);

    const network = await withRetry(() => provider.getNetwork(), "getNetwork");
    log("INFO", `Network : ${network.name} (chainId: ${network.chainId})`);

    const wallet = new ethers.Wallet(cfg.automationKey, provider);
    log("INFO", `Automation wallet: ${wallet.address}`);

    const walletBalance = await withRetry(() => provider.getBalance(wallet.address), "walletBalance");
    log("INFO", `Automation wallet balance: ${ethers.formatEther(walletBalance)} ETH`);
    if (walletBalance < ethers.parseEther("0.001")) {
        log("WARN", "Automation wallet balance is critically low (<0.001 ETH) — gas payments may fail!");
    }

    const contract = new ethers.Contract(cfg.contractAddress, CONTRACT_ABI, wallet);

    // ── Authorization Check ────────────────────────────────
    const registeredAuto = await withRetry(
        () => contract.automationRegistry(),
        "automationRegistry"
    );
    if (registeredAuto === ethers.ZeroAddress) {
        log("WARN", "automationRegistry not set — owner-fallback is active. Call setAutomation() to restrict access.");
    } else if (registeredAuto.toLowerCase() !== wallet.address.toLowerCase()) {
        log("ERROR",
            `This wallet (${wallet.address}) is NOT the registered automation address (${registeredAuto}). ` +
            `Transaction WILL revert. Update setAutomation() on the contract or use the correct wallet.`
        );
        throw new Error("Automation wallet mismatch — aborting to avoid wasting gas");
    } else {
        log("INFO", `Authorization: OK — wallet matches automationRegistry`);
    }

    // ── Pre-flight ─────────────────────────────────────────
    log("INFO", "Running pre-flight checks…");
    const check = await preflight(contract);
    log(check.shouldExecute ? "INFO" : "INFO", check.reason);

    if (!check.shouldExecute) {
        log("INFO", "CRE workflow complete — no action needed.");
        return;
    }

    log("WARN", `⚡ INACTIVITY DETECTED: ${check.inactivityPeriod}s inactive | Balance: ${check.balance} ETH`);

    // ── Execute ────────────────────────────────────────────
    await executeWithGuards(contract, provider, wallet.address);

    log("INFO", "════════════════════════════════════════");
    log("SUCCESS", "CRE Workflow complete — inheritance executed.");
    log("INFO", "════════════════════════════════════════");
}

// ── Watch Mode (continuous polling) ───────────────────────
async function watchMode(cfg: WorkflowConfig): Promise<void> {
    log("INFO", `Watch mode — polling every ${POLL_INTERVAL_MS / 1000}s. Press Ctrl+C to stop.`);
    // Always run once immediately, then loop
    while (true) {
        try {
            await runWorkflow(cfg);
        } catch (err: any) {
            log("ERROR", `Workflow run error: ${err.message}`);
        }
        log("INFO", `Next poll in ${POLL_INTERVAL_MS / 1000}s…`);
        await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));
    }
}

// ── Standalone Entry Point ─────────────────────────────────
if (require.main === module) {
    const contractAddress = process.env.VAULT_ADDRESS || "";
    const providerUrl     = process.env.BASE_SEPOLIA_RPC_URL || process.env.SEPOLIA_RPC_URL || "http://127.0.0.1:8545";
    const automationKey   = process.env.AUTOMATION_PRIVATE_KEY || process.env.PRIVATE_KEY || "";
    const watch           = process.argv.includes("--watch");

    if (!contractAddress) {
        log("ERROR", "VAULT_ADDRESS not set in .env — cannot run workflow");
        process.exit(1);
    }
    if (!automationKey) {
        log("ERROR", "AUTOMATION_PRIVATE_KEY or PRIVATE_KEY not set in .env");
        process.exit(1);
    }

    const cfg: WorkflowConfig = { contractAddress, providerUrl, automationKey };

    (watch ? watchMode(cfg) : runWorkflow(cfg)).catch((err) => {
        log("ERROR", `Fatal: ${err.message}`);
        process.exit(1);
    });
}

