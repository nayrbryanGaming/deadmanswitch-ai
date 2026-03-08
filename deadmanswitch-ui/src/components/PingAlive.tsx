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
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 sm:p-5 border border-white/20 shadow-xl flex flex-col items-center justify-center">
            <h2 className="text-sm font-bold mb-3 text-white tracking-wide uppercase opacity-80">Activity Check</h2>
            <button
                onClick={handlePing}
                disabled={loading}
                className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center text-white font-bold text-xs text-center border-2 border-white/20 transition-all duration-500 shadow-[0_0_24px_rgba(124,58,237,0.3)] hover:shadow-[0_0_40px_rgba(124,58,237,0.6)] ${loading ? 'bg-gray-600 cursor-not-allowed' : 'bg-purple-600 hover:scale-105 active:scale-95'
                    }`}
            >
                <span className={loading ? '' : 'animate-pulse'}>
                    {loading ? "Pinging..." : "I'm ALIVE"}
                </span>
            </button>
            <p className="mt-3 text-xs text-gray-400 text-center">Click to update your last activity timestamp</p>
        </div>
    );
};
