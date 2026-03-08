import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { sepolia, baseSepolia } from 'wagmi/chains';

export const config = getDefaultConfig({
    appName: 'DEADMANSWITCH AI',
    projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '6ae75476a6d36e2f8ec5b085732c45ee',
    chains: [baseSepolia, sepolia],
    ssr: true,
});
