import { PrismaClient } from '@prisma/client';
import { ethers } from 'ethers';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Simple ABI for storing hashes
const CONTRACT_ABI = [
  'function storeHash(string memory hash) public',
  'function getHash(uint256 index) public view returns (string memory)'
];

const BYTECODE = '0x608060405234801561001057600080fd5b50610489806100206000396000f3fe608060405234801561001057600080fd5b50600436106100365760003560e01c806354d43e131461003b5780636975934b14610059575b600080fd5b610043610075565b604051610050919061023c565b60405180910390f35b610073600480360381019061006e9190610288565b610118565b005b6060600082610080919061030f565b90506000826100909190610336565b905080156100f95760405162461bcd60e51b81526004016100f090610386565b60405180910390fd5b8151602083015160408401516060850151608086015160a087015181600090610111906103a9565b505050505050919050565b80600160008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000209080519060200190610163929190610167565b5050565b828054610173906103f0565b90600052602060002090601f01602090048101928261019557600085556101dc565b828001600101855582156101dc579182015b828111156101db5782518255916020019190600101906101bf565b505090506101d991906101df565b5090565b5b5050505050505050565b61020191905b808211156101fd5760008160009055506001016101e5565b5090565b90565b6102198161020a565b82525050565b6102288161020a565b82525050565b60006020820190506102436000830184610210565b92915050565b60006020820190508181036000830152610261818461021f565b90506102726020830184610210565b9392505050565b6000806040838503121561028a578182fd5b823567ffffffffffffffff808211156102a2578384fd5b818501915085601f8301126102b6578384fd5b81356020828111156102c9578485fd5b8260016001871603018211156102e1578485fd5b8601601f8301356102ef918401919061031d565b97509795505050505050565b6000815180845260005b8181101561033157602081860181015185830182015201610314565b505050505050565b600082601f830112610349578081fd5b813567ffffffffffffffff8111156103635761036361044e565b604051601f8201601f1916810160200183811182821017156103815761038161044e565b604052818152838201602001871015610399578384fd5b81602085018484013b8411156103ad578384fd5b83868686013b818701918686013b8601378787013b818401919091018601379350505050505050565b6000815180845260208401935060208301925082805b8281101561040457815187870185015260200181016103e9565b505050505050565b6000601f19601f8301169050919050565b6104248161020a565b82525050565b600082601f83011261043c578081fd5b813561044d601f8201601f191660200161041b565b9392505050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fdfea2646970667358221220000000000000000000000000000000000000000000000000000000000000000064736f6c63430008130033';

export class BlockchainService {
  private provider: ethers.JsonRpcProvider | null = null;
  private wallet: ethers.Wallet | null = null;
  private contract: ethers.Contract | null = null;

  constructor() {
    this.init();
  }

  private init() {
    try {
      const ganacheUrl = process.env.GANACHE_URL || 'http://localhost:8545';
      this.provider = new ethers.JsonRpcProvider(ganacheUrl);

      const privateKey = process.env.PRIVATE_KEY;
      if (privateKey) {
        this.wallet = new ethers.Wallet(privateKey, this.provider);
      }

      const contractAddress = process.env.CONTRACT_ADDRESS;
      if (contractAddress && this.wallet) {
        this.contract = new ethers.Contract(contractAddress, CONTRACT_ABI, this.wallet);
      }
    } catch (error) {
      console.log('Blockchain: Ganache not available, using hash-only mode');
    }
  }

  async hashData(entityType: string, entityId: number, data: object): Promise<string> {
    const content = JSON.stringify({ entityType, entityId, ...data, timestamp: Date.now() });
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  async storeHash(entityType: string, entityId: number, data: object, userId: number, vooSubmissionId?: number, misconductId?: number) {
    const hash = await this.hashData(entityType, entityId, data);
    let txHash: string | null = null;
    let blockNumber: number | null = null;

    // Try to store on Ethereum if Ganache is available
    try {
      if (this.contract && this.wallet) {
        const tx = await this.contract.storeHash(hash);
        const receipt = await tx.wait();
        txHash = receipt.hash;
        blockNumber = receipt.blockNumber;
      }
    } catch (error) {
      console.log('Blockchain: Ganache not reachable, storing hash locally only');
    }

    // Always store hash in database
    const record = await prisma.blockchainHash.create({
      data: {
        entityType,
        entityId,
        data: hash,
        txHash,
        blockNumber,
        contractAddress: process.env.CONTRACT_ADDRESS || null,
        vooSubmissionId: vooSubmissionId || null,
        misconductId: misconductId || null,
        createdById: userId
      }
    });

    return { hash, txHash, blockNumber, record };
  }

  async verifyHash(hashId: number) {
    const record = await prisma.blockchainHash.findUnique({ where: { id: hashId } });
    if (!record) throw new Error('Hash record not found');

    let onChainHash: string | null = null;
    try {
      if (this.contract) {
        onChainHash = await this.contract.getHash(record.blockNumber || 0);
      }
    } catch (error) {
      onChainHash = null;
    }

    return {
      localHash: record.data,
      onChainHash,
      matches: onChainHash === record.data,
      txHash: record.txHash,
      blockNumber: record.blockNumber
    };
  }

  isAvailable(): boolean {
    return this.provider !== null && this.wallet !== null;
  }
}
