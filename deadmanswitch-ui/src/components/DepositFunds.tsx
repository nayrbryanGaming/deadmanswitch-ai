'use client';

import { useState } from 'react';
import { ethers } from 'ethers';
import { useEthersSigner } from '@/lib/hooks/useEthersSigner';
import { getContract } from '@/lib/contract';

export const DepositFunds = () => {
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const signer = useEthersSigner();

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
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-xl">
            <h2 className="text-xl font-bold mb-4 text-white">Deposit ETH</h2>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm text-gray-400 mb-1">Amount (ETH)</label>
                    <input
                        type="number"
                        step="0.01"
                        placeholder="0.5"
                        className="w-full bg-black/40 border border-white/20 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                    />
                </div>
                <button
                    onClick={handleDeposit}
                    disabled={loading}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-bold py-3 rounded-lg transition-colors"
                >
                    {loading ? "Processing..." : "Deposit Funds"}
                </button>
            </div>
        </div>
    );
};
