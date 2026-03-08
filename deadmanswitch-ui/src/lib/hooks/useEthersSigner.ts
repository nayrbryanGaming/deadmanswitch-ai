import { BrowserProvider, JsonRpcSigner, getAddress } from 'ethers';
import { useMemo } from 'react';
import type { Account, Chain, Client, Transport } from 'viem';
import { type Config, useConnectorClient } from 'wagmi';

export function clientToSigner(client: Client<Transport, Chain, Account>) {
    const { account, chain, transport } = client;
    // Pass chain.id (not custom object) — avoids ENS UNSUPPORTED_OPERATION on Base Sepolia.
    // getAddress() force-checksums the address so ethers never attempts ENS resolution on it.
    const provider = new BrowserProvider(transport, chain.id);
    const signer = new JsonRpcSigner(provider, getAddress(account.address));
    return signer;
}

/** Hook to convert a viem Wallet Client to an ethers.js Signer. */
export function useEthersSigner({ chainId }: { chainId?: number } = {}) {
    const { data: client } = useConnectorClient<Config>({ chainId });
    return useMemo(() => (client ? clientToSigner(client) : undefined), [client]);
}
