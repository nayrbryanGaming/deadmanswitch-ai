'use client';

import { useState } from 'react';
import { ethers } from 'ethers';
import { useChainId, useAccount } from 'wagmi';
import { useEthersSigner } from '@/lib/hooks/useEthersSigner';
import { getContract } from '@/lib/contract';

const BASE_SEPOLIA_ID = 84532;

export const DepositFunds = () => {
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const signer = useEthersSigner();
    const chainId = useChainId();
    const { isConnected } = useAccount();
    const isWrongChain = isConnected && chainId !== BASE_SEPOLIA_ID;

    const handleDeposit = async () => {
        if (!signer || !amount) return;

        if (parseFloat(amount) <= 0) {
            alert("Please enter an amount greater than 0.");
            return;
        }

        setLoading(true);
        try {
            const contract = await getContract(signer);
            const tx = await contract.deposit({ value: ethers.parseEther(amount) });
            console.log("Depositing funds...", tx.hash);
            await tx.wait();
            alert(`Deposited ${amount} ETH successfully!`);
        } catch (error: any) {
            console.error("Deposit failed:", error);
            alert("Error: " + (error.reason || error.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 sm:p-5 border border-white/20 shadow-xl">
            <h2 className="text-sm font-bold mb-3 text-white tracking-wide uppercase opacity-80">Deposit ETH</h2>
            <div className="space-y-3">
                <div>
                    <label className="block text-xs text-gray-400 mb-1">Amount (ETH)</label>
                    <input
                        type="number"
                        step="0.01"
                        placeholder="0.5"
                        className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                    />
                </div>
                {isWrongChain && (
                    <p className="text-xs text-amber-400 bg-amber-400/10 border border-amber-400/30 rounded-lg px-3 py-2">
                        ⚠ Switch to <strong>Base Sepolia</strong> network
                    </p>
                )}
                <button
                    onClick={handleDeposit}
                    disabled={loading || !isConnected || isWrongChain}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm font-bold py-2 rounded-lg transition-colors"
                >
                    {loading ? "Processing..." : !isConnected ? "Connect Wallet" : isWrongChain ? "Wrong Network" : "Deposit Funds"}
                </button>
            </div>
        </div>
    );
};
