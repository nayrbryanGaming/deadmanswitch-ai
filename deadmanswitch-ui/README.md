# DEADMANSWITCH AI – Web3 Frontend Dashboard

A premium, production-quality dashboard for the Autonomous Crypto Inheritance Protocol. Built with Next.js, ethers.js, and RainbowKit.

## 🚀 Deployment Instructions

### 1. Prerequisites
- Node.js (v18+)
- Metamask or any injected EIP-1193 wallet
- Sepolia ETH (for testnet demo)

### 2. Local Setup
```bash
# Clone the repository (if applicable)
# Navigate to the UI directory
cd deadmanswitch-ui

# Install dependencies
npm install

# Start the development server
npm run dev
```

### 3. Configuration
Update `src/lib/contract.ts` with your deployed `CONTRACT_ADDRESS`.
Update `src/lib/config.ts` with your `WALLETCONNECT_PROJECT_ID`.

### 4. Vercel Deployment
1. Push your code to GitHub.
2. Connect your repository to [Vercel](https://vercel.com).
3. Add the following environment variables (if any, though this prototype uses local config for simplicity).
4. Click **Deploy**.

## 🛠 Features
- **Wallet Connection**: Integrated with RainbowKit for a seamless Web3 experience.
- **Beneficiary Registration**: Securely set your heir and inactivity threshold.
- **Asset Custody**: Deposit ETH directly into the Inheritance Vault.
- **Proof of Life**: One-click "I'm Alive" pulse check to prevent accidental triggers.
- **Real-time Analytics**: Live view of vault balance, owner activity, and heir status.

## 🎨 Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Web3**: ethers.js, wagmi, viem, RainbowKit
- **Styling**: TailwindCSS
- **State Management**: React Query

---
Built for the DEADMANSWITCH AI Hackathon.
