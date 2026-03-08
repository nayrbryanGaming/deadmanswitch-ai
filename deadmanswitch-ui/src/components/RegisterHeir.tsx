'use client';

import { useState } from 'react';
import { ethers } from 'ethers';
import { useEthersSigner } from '@/lib/hooks/useEthersSigner';
import { getContract } from '@/lib/contract';

type Unit = 'days' | 'weeks' | 'months';

const UNIT_SECONDS: Record<Unit, number> = {
    days: 86400,
    weeks: 604800,
    months: 2592000, // 30 days
};

const UNIT_LABELS: Record<Unit, string> = {
    days: 'Day(s)',
    weeks: 'Week(s)',
    months: 'Month(s)',
};

function toSeconds(value: number, unit: Unit): number {
    return Math.floor(value * UNIT_SECONDS[unit]);
}

export const RegisterHeir = () => {
    const [heir, setHeir] = useState('');
    const [amount, setAmount] = useState(1);
    const [unit, setUnit] = useState<Unit>('months');
    const [loading, setLoading] = useState(false);
    const signer = useEthersSigner();

    const thresholdSeconds = toSeconds(amount, unit);

    const handleRegister = async () => {
        if (!signer || !heir) return;

        if (!ethers.isAddress(heir)) {
            alert('Please enter a valid Ethereum address.');
            return;
        }

        if (amount <= 0) {
            alert('Inactivity period must be greater than 0.');
            return;
        }

        setLoading(true);
        try {
            const contract = await getContract(signer);
            const tx = await contract.registerHeir(heir, thresholdSeconds);
            console.log('Registering heir...', tx.hash);
            await tx.wait();
            alert(`Heir registered! Switch will trigger after ${amount} ${unit} of inactivity.`);
        } catch (error: any) {
            console.error('Registration failed:', error);
            alert('Error: ' + (error.reason || error.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-white/20 shadow-xl">
            <h2 className="text-base sm:text-xl font-bold mb-3 sm:mb-4 text-white">Register Beneficiary</h2>
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
                    <label className="block text-sm text-gray-400 mb-1">Inactivity Threshold</label>
                    <div className="flex gap-2">
                        <input
                            type="number"
                            min={1}
                            step={1}
                            aria-label="Inactivity threshold amount"
                            title="Inactivity threshold amount"
                            className="w-24 bg-black/40 border border-white/20 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                            value={amount}
                            onChange={(e) => setAmount(Math.max(1, parseInt(e.target.value) || 1))}
                        />
                        <div className="flex flex-1 rounded-lg overflow-hidden border border-white/20">
                            {(['days', 'weeks', 'months'] as Unit[]).map((u) => (
                                <button
                                    key={u}
                                    onClick={() => setUnit(u)}
                                    className={`flex-1 py-2 sm:py-3 text-xs sm:text-sm font-semibold transition-colors ${
                                        unit === u
                                            ? 'bg-purple-600 text-white'
                                            : 'bg-black/40 text-gray-400 hover:bg-white/10'
                                    }`}
                                >
                                    {UNIT_LABELS[u]}
                                </button>
                            ))}
                        </div>
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                        = {thresholdSeconds.toLocaleString()} seconds — switch triggers after {amount} {unit} of inactivity
                    </p>
                </div>

                <button
                    onClick={handleRegister}
                    disabled={loading}
                    className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white font-bold py-3 rounded-lg transition-colors"
                >
                    {loading ? 'Registering...' : 'Register Heir'}
                </button>
            </div>
        </div>
    );
};
