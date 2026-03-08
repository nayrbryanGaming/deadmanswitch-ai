'use client';

import { useState } from 'react';
import { ethers } from 'ethers';
import { useEthersSigner } from '@/lib/hooks/useEthersSigner';
import { getContract } from '@/lib/contract';

export const RegisterHeir = () => {
    const [heir, setHeir] = useState('');
    const [threshold, setThreshold] = useState('86400'); // Default 1 day in seconds
    const [loading, setLoading] = useState(false);
    const signer = useEthersSigner();

    const handleRegister = async () => {
        if (!signer || !heir) return;

        if (!ethers.isAddress(heir)) {
            alert("Please enter a valid Ethereum address.");
            return;
        }

        setLoading(true);
        try {
            const contract = await getContract(signer);
            const tx = await contract.registerHeir(heir, threshold);
            console.log("Registering heir...", tx.hash);
            await tx.wait();
            alert("Heir registered successfully!");
        } catch (error: any) {
            console.error("Registration failed:", error);
            alert("Error: " + (error.reason || error.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-xl">
            <h2 className="text-xl font-bold mb-4 text-white">Register Beneficiary</h2>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm text-gray-400 mb-1">Heir Address</label>
                    <input
                        type="text"
                        placeholder="0x..."
                        className="w-full bg-black/40 border border-white/20 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                        value={heir}
                        onChange={(e) => setHeir(e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-sm text-gray-400 mb-1">Inactivity Threshold (seconds)</label>
                    <input
                        type="number"
                        placeholder="86400"
                        className="w-full bg-black/40 border border-white/20 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                        value={threshold}
                        onChange={(e) => setThreshold(e.target.value)}
                    />
                </div>
                <button
                    onClick={handleRegister}
                    disabled={loading}
                    className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white font-bold py-3 rounded-lg transition-colors"
                >
                    {loading ? "Registering..." : "Register Heir"}
                </button>
            </div>
        </div>
    );
};
