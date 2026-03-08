import { BrowserProvider, JsonRpcSigner } from 'ethers';
import { useMemo } from 'react';
import type { Account, Chain, Client, Transport } from 'viem';
import { type Config, useConnectorClient } from 'wagmi';

export function clientToSigner(client: Client<Transport, Chain, Account>) {
    const { account, chain, transport } = client;
    // Use chain.id (not a custom object) so ethers uses its built-in registry
    // which handles Base Sepolia's lack of ENS gracefully (no UNSUPPORTED_OPERATION error)
    const provider = new BrowserProvider(transport, chain.id);
    const signer = new JsonRpcSigner(provider, account.address);
    return signer;
}

/** Hook to convert a viem Wallet Client to an ethers.js Signer. */
export function useEthersSigner({ chainId }: { chainId?: number } = {}) {
    const { data: client } = useConnectorClient<Config>({ chainId });
    return useMemo(() => (client ? clientToSigner(client) : undefined), [client]);
}
