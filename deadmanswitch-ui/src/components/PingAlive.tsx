'use client';

import { useState } from 'react';
import { useEthersSigner } from '@/lib/hooks/useEthersSigner';
import { getContract } from '@/lib/contract';

export const PingAlive = () => {
    const [loading, setLoading] = useState(false);
    const signer = useEthersSigner();

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
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-white/20 shadow-xl flex flex-col items-center justify-center">
            <h2 className="text-base sm:text-xl font-bold mb-3 sm:mb-4 text-white">Activity Check</h2>
            <button
                onClick={handlePing}
                disabled={loading}
                className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full flex items-center justify-center text-white font-bold text-center border-4 border-white/20 transition-all duration-500 shadow-[0_0_30px_rgba(124,58,237,0.3)] hover:shadow-[0_0_50px_rgba(124,58,237,0.6)] ${loading ? 'bg-gray-600 cursor-not-allowed' : 'bg-purple-600 hover:scale-105 active:scale-95'
                    }`}
            >
                <span className={loading ? '' : 'animate-pulse'}>
                    {loading ? "Pinging..." : "I'm ALIVE"}
                </span>
            </button>
            <p className="mt-4 text-sm text-gray-400">Click to update your last activity timestamp</p>
        </div>
    );
};
