# DEADMANSWITCH AI – Autonomous Crypto Inheritance Protocol

**DEADMANSWITCH AI** is a production-quality prototype demonstrating how Chainlink Runtime Environment (CRE) can automate crypto inheritance using off-chain monitoring and on-chain execution.

## 🏗 Architecture

```mermaid
graph TD
    Owner[Wallet Owner] -->|Deposit/Ping| Vault(InheritanceVault Smart Contract)
    Monitor[Off-chain Monitoring Service] -->|Check inactivity| Vault
    Monitor -->|Trigger| CRE[Chainlink CRE Workflow]
    CRE -->|Execute Inheritence| Vault
    Vault -->|Transfer Funds| Heir[Beneficiary / Heir]
```

## 🖥 Frontend Dashboard
The project includes a premium **Web3 Dashboard** located in the `deadmanswitch-ui/` directory. It allows users to interact with the protocol via a sleek, dark-mode interface.

## 🚀 Getting Started

### Prerequisites
- Node.js & npm
- Hardhat

### Installation
```bash
npm install
```

### 🛠 Running the Simulation

Follow these steps to see the protocol in action:

1. **Start a local Hardhat node:**
   ```bash
   npx hardhat node
   ```

2. **Deploy the Smart Contract:**
   (In a new terminal)
   ```bash
   npx hardhat run scripts/deploy.ts --network localhost
   ```

3. **Run the Simulation:**
   ```bash
   npx ts-node src/monitor.ts
   ```

## 📜 Smart Contract Features
- **Inactivity Monitoring:** Tracks `lastPingTimestamp` for the owner.
- **Automated Execution:** Allows authorized automation addresses to trigger inheritance.
- **Gas Optimized:** Uses efficient reentrancy guards and storage patterns.
- **Safe Transfers:** Implements the recommended `call` pattern for ETH transfers.

## 🤖 CRE Workflow Logic
The CRE workflow fetches on-chain data to verify inactivity thresholds before executing the inheritance function, ensuring that funds are only moved when conditions are strictly met.

---
Built for the Web3 hackathon submission.

## Core Architecture
- **InheritanceVault (Solidity)**: Manages heirs, thresholds, and secure ETH holding.
- **CRE Workflow (TypeScript)**: Off-chain logic that monitors on-chain pings and triggers execution.
- **Monitoring Service**: Periodically checks for inactivity via CRE APIs.

## Production-Ready Features (Iterative Improvements)
- **Restricted Execution**: `executeInheritance` is limited to the authorized Automation Registry.
- **Auto-Activity Detection**: Any interaction (deposit/receive) by the owner automatically pings the contract.
- **Reentrancy Protection**: Implemented a state-based guard for the exit transfer.
- **Safe Transfer Pattern**: Uses the recommended `call` pattern for Ether transfers.

## Repository Structure
```
deadmanswitch-ai/
├── contracts/
│   └── InheritanceVault.sol  # Secure Contract
├── scripts/
│   └── deploy.ts             # Deployment Logic
├── cre/
│   └── workflow.ts           # Chainlink CRE Logic
├── src/
│   └── monitor.ts            # Simulation & Monitoring
├── hardhat.config.ts         # Configuration
└── README.md                 # Documentation
```

## Quick Start & Simulation

### 1. Project Setup
```bash
npm install
```

### 2. Deploy (Local Simulation)
Start a local node:
```bash
npx hardhat node
```
Deploy the contract:
```bash
npx hardhat run scripts/deploy.ts --network localhost
```

### 3. Run Simulation
The simulation demonstrates the full lifecycle:
1. User deposits funds.
2. User registers heir.
3. User stops pinging.
4. **CRE Workflow** detects inactivity.
5. **CRE Workflow** triggers inheritance.

```bash
npx ts-node src/monitor.ts
```

## Security & Reliability
- [x] **Owner-only Access Control**: Verified via `onlyOwner`.
- [x] **Automation-only Trigger**: Verified via `onlyAutomation`.
- [x] **Safe ETH Transfer**: Verified via `call` pattern.
- [x] **Traceable Logs**: Provided by CRE and EVM events.

---
**Hackathon submission code.** | Powered by Chainlink CRE.
