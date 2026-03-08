import { ethers } from 'ethers';

export const CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_VAULT_ADDRESS || '0x7aD44599A09656D0430D939510c1991A85d8fb73').trim();

export const CONTRACT_ABI = [
    "function owner() view returns (address)",
    "function heir() view returns (address)",
    "function lastPingTimestamp() view returns (uint256)",
    "function inactivityThreshold() view returns (uint256)",
    "function deposit() payable",
    "function registerHeir(address, uint256)",
    "function setAutomation(address)",
    "function ping()",
    "function executeInheritance()",
    "function getStatus() view returns (address, address, uint256, uint256, uint256)",
    "event HeirRegistered(address indexed heir, uint256 threshold)",
    "event Pinged(uint256 timestamp)",
    "event InheritanceExecuted(address indexed heir, uint256 amount)",
    "event Deposited(address indexed sender, uint256 amount)"
];

export const getContract = async (signerOrProvider: ethers.Signer | ethers.Provider) => {
    // ethers.getAddress() normalizes to EIP-55 checksum so ethers never treats it as ENS name
    return new ethers.Contract(ethers.getAddress(CONTRACT_ADDRESS), CONTRACT_ABI, signerOrProvider);
};
