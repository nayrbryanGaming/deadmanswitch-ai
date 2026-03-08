'use client';

import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { useEthersProvider } from '@/lib/hooks/useEthersProvider';
import { getContract } from '@/lib/contract';

function formatThreshold(seconds: number): string {
    if (seconds === 0) return 'Not set';
    const months = seconds / 2592000;
    const weeks = seconds / 604800;
    const days = seconds / 86400;
    const hours = seconds / 3600;
    if (months >= 1 && Number.isInteger(Math.round(months * 10) / 10))
        return `${parseFloat(months.toFixed(1))} month${months !== 1 ? 's' : ''}`;
    if (weeks >= 1 && days % 7 === 0)
        return `${Math.round(weeks)} week${Math.round(weeks) !== 1 ? 's' : ''}`;
    if (days >= 1 && seconds % 86400 === 0)
        return `${Math.round(days)} day${Math.round(days) !== 1 ? 's' : ''}`;
    if (hours >= 1)
        return `${parseFloat(hours.toFixed(1))} hour${hours !== 1 ? 's' : ''}`;
    return `${seconds} seconds`;
}

export const VaultStatus = () => {
    const [status, setStatus] = useState<any>(null);
    const provider = useEthersProvider();

    const fetchStatus = async () => {
        if (!provider) return;
        try {
            const contract = await getContract(provider);
            const [owner, heir, lastPing, threshold, balance] = await contract.getStatus();

            setStatus({
                owner,
                heir,
                lastPing: Number(lastPing),
                threshold: Number(threshold),
                balance: ethers.formatEther(balance)
            });
        } catch (error) {
            console.error("Failed to fetch status. Ensure the contract is deployed to the correct address.", error);
            setStatus("ERROR");
        }
    };

    useEffect(() => {
        fetchStatus();
        const interval = setInterval(fetchStatus, 10000); // Update every 10s
        return () => clearInterval(interval);
    }, [provider]);

    if (status === "ERROR") return (
        <div className="bg-red-900/20 rounded-2xl p-6 border border-red-500/50">
            <h2 className="text-xl font-bold mb-2 text-red-400">Connect Wallet</h2>
            <p className="text-sm text-red-300/80">
                Please connect your wallet and switch to <span className="text-white font-semibold">Base Sepolia</span> network to view vault status.
            </p>
        </div>
    );

    if (!status) return (
        <div className="bg-white/5 rounded-2xl p-6 border border-white/10 animate-pulse">
            <div className="h-4 bg-white/20 rounded w-1/2 mb-4"></div>
            <div className="space-y-3">
                <div className="h-3 bg-white/10 rounded"></div>
                <div className="h-3 bg-white/10 rounded"></div>
                <div className="h-3 bg-white/10 rounded"></div>
            </div>
        </div>
    );

    return (
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-white/20 shadow-xl overflow-hidden relative">
            <div className="absolute top-0 right-0 p-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-ping"></div>
            </div>
            <h2 className="text-base sm:text-xl font-bold mb-3 sm:mb-4 text-white">Vault Analytics</h2>
            <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-white/10 pb-2">
                    <span className="text-gray-400 text-sm">Owner</span>
                    <span className="text-white text-xs font-mono">{status.owner.slice(0, 6)}...{status.owner.slice(-4)}</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/10 pb-2">
                    <span className="text-gray-400 text-sm">Beneficiary</span>
                    <span className="text-white text-xs font-mono">
                        {status.heir === '0x0000000000000000000000000000000000000000' ? 'None Set' : `${status.heir.slice(0, 6)}...${status.heir.slice(-4)}`}
                    </span>
                </div>
                <div className="flex justify-between items-center border-b border-white/10 pb-2">
                    <span className="text-gray-400 text-sm">Last Active</span>
                    <span className="text-white text-sm">{new Date(status.lastPing * 1000).toLocaleTimeString()}</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/10 pb-2">
                    <span className="text-gray-400 text-sm">Threshold</span>
                    <span className="text-white text-sm">{formatThreshold(status.threshold)}</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                    <span className="text-purple-400 font-bold text-sm sm:text-base">Total Assets</span>
                    <span className="text-xl sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-green-400">
                        {status.balance} ETH
                    </span>
                </div>
            </div>
        </div>
    );
};
