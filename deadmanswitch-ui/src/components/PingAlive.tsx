'use client';

import { useState } from 'react';
import { useChainId, useAccount } from 'wagmi';
import { useEthersSigner } from '@/lib/hooks/useEthersSigner';
import { getContract } from '@/lib/contract';

const BASE_SEPOLIA_ID = 84532;

export const PingAlive = () => {
    const [loading, setLoading] = useState(false);
    const signer = useEthersSigner();
    const chainId = useChainId();
    const { isConnected } = useAccount();
    const isWrongChain = isConnected && chainId !== BASE_SEPOLIA_ID;

    const handlePing = async () => {
        if (!signer) return;
        setLoading(true);
        try {
            const contract = await getContract(signer);
            const tx = await contract.ping();
            console.log("Sending ping...", tx.hash);
            await tx.wait();
            alert("Stayin' Alive! Activity updated.");
        } catch (error: any) {
            console.error("Ping failed:", error);
            alert("Error: " + (error.reason || error.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 sm:p-5 border border-white/20 shadow-xl flex flex-col items-center justify-center">
            <h2 className="text-sm font-bold mb-3 text-white tracking-wide uppercase opacity-80">Activity Check</h2>
            {isWrongChain && (
                <p className="text-xs text-amber-400 bg-amber-400/10 border border-amber-400/30 rounded-lg px-3 py-1.5 mb-2">
                    ⚠ Switch to <strong>Base Sepolia</strong>
                </p>
            )}
            <button
                onClick={handlePing}
                disabled={loading || !isConnected || isWrongChain}
                className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center text-white font-bold text-xs text-center border-2 border-white/20 transition-all duration-500 shadow-[0_0_24px_rgba(124,58,237,0.3)] hover:shadow-[0_0_40px_rgba(124,58,237,0.6)] ${
                    loading || !isConnected || isWrongChain ? 'bg-gray-600 cursor-not-allowed' : 'bg-purple-600 hover:scale-105 active:scale-95'
                }`}
            >
                <span className={`whitespace-pre-line leading-tight ${loading ? '' : (!isConnected || isWrongChain ? '' : 'animate-pulse')}`}>
                    {loading ? 'Pinging...' : !isConnected ? 'Connect\nWallet' : isWrongChain ? 'Wrong\nNet' : "I'm\nALIVE"}
                </span>
            </button>
            <p className="mt-3 text-xs text-gray-400 text-center">Click to update your last activity timestamp</p>
        </div>
    );
};
