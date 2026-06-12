import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

export class BlockchainService {
  private calculateHash(
    blockIndex: number,
    previousHash: string,
    timestamp: string,
    data: string,
    nonce: number
  ): string {
    return crypto
      .createHash('sha256')
      .update(blockIndex + previousHash + timestamp + data + nonce)
      .digest('hex');
  }

  async createGenesisBlock() {
    const existingBlocks = await prisma.blockchainLog.count();
    
    if (existingBlocks > 0) {
      return null; // Genesis already exists
    }

    const genesisData = JSON.stringify({
      message: 'Genesis Block - Merit-Misconduct System',
      company: 'PT Bridgestone Tire Indonesia',
      plant: 'Bekasi Plant'
    });

    const timestamp = new Date().toISOString();
    const previousHash = '0';
    const currentHash = this.calculateHash(0, previousHash, timestamp, genesisData, 0);

    const genesisBlock = await prisma.blockchainLog.create({
      data: {
        blockIndex: 0,
        previousHash,
        currentHash,
        timestamp: new Date(),
        eventType: 'genesis',
        eventId: 0,
        data: genesisData,
        nonce: 0,
        isValid: true
      }
    });

    return genesisBlock;
  }

  async addBlock(eventType: 'merit' | 'misconduct', eventId: number, eventData: any) {
    const lastBlock = await prisma.blockchainLog.findFirst({
      orderBy: { blockIndex: 'desc' }
    });

    if (!lastBlock) {
      await this.createGenesisBlock();
      return this.addBlock(eventType, eventId, eventData);
    }

    const newBlockIndex = lastBlock.blockIndex + 1;
    const timestamp = new Date().toISOString();
    const data = JSON.stringify(eventData);
    let nonce = 0;
    let currentHash = '';

    // Simple proof of work (difficulty = 2 leading zeros)
    do {
      nonce++;
      currentHash = this.calculateHash(
        newBlockIndex,
        lastBlock.currentHash,
        timestamp,
        data,
        nonce
      );
    } while (!currentHash.startsWith('00'));

    const newBlock = await prisma.blockchainLog.create({
      data: {
        blockIndex: newBlockIndex,
        previousHash: lastBlock.currentHash,
        currentHash,
        timestamp: new Date(timestamp),
        eventType,
        eventId,
        meritEventId: eventType === 'merit' ? eventId : null,
        misconductEventId: eventType === 'misconduct' ? eventId : null,
        data,
        nonce,
        isValid: true
      }
    });

    return newBlock;
  }

  async verifyChain() {
    const blocks = await prisma.blockchainLog.findMany({
      orderBy: { blockIndex: 'asc' }
    });

    if (blocks.length === 0) {
      return { isValid: true, message: 'Chain is empty' };
    }

    const invalidBlocks = [];

    for (let i = 1; i < blocks.length; i++) {
      const currentBlock = blocks[i];
      const previousBlock = blocks[i - 1];

      // Verify previous hash
      if (currentBlock.previousHash !== previousBlock.currentHash) {
        invalidBlocks.push({
          blockIndex: currentBlock.blockIndex,
          reason: 'Previous hash mismatch'
        });
        continue;
      }

      // Verify current hash
      const calculatedHash = this.calculateHash(
        currentBlock.blockIndex,
        currentBlock.previousHash,
        currentBlock.timestamp.toISOString(),
        currentBlock.data,
        currentBlock.nonce
      );

      if (currentBlock.currentHash !== calculatedHash) {
        invalidBlocks.push({
          blockIndex: currentBlock.blockIndex,
          reason: 'Hash mismatch'
        });
      }
    }

    // Update invalid blocks in database
    if (invalidBlocks.length > 0) {
      await Promise.all(
        invalidBlocks.map(block =>
          prisma.blockchainLog.update({
            where: { blockIndex: block.blockIndex },
            data: { isValid: false }
          })
        )
      );
    }

    return {
      isValid: invalidBlocks.length === 0,
      totalBlocks: blocks.length,
      invalidBlocks,
      message: invalidBlocks.length === 0 ? 'Chain is valid' : 'Chain has been tampered'
    };
  }

  async getBlockchain(page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit;

    const [blocks, total] = await Promise.all([
      prisma.blockchainLog.findMany({
        orderBy: { blockIndex: 'desc' },
        skip,
        take: limit,
        include: {
          meritEvent: {
            include: {
              operator: {
                include: {
                  user: {
                    select: {
                      fullName: true,
                      username: true
                    }
                  }
                }
              }
            }
          },
          misconductEvent: {
            include: {
              operator: {
                include: {
                  user: {
                    select: {
                      fullName: true,
                      username: true
                    }
                  }
                }
              }
            }
          }
        }
      }),
      prisma.blockchainLog.count()
    ]);

    return {
      blocks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getBlockByIndex(blockIndex: number) {
    return await prisma.blockchainLog.findUnique({
      where: { blockIndex },
      include: {
        meritEvent: {
          include: {
            operator: {
              include: {
                user: true,
                department: true,
                productionLine: true
              }
            }
          }
        },
        misconductEvent: {
          include: {
            operator: {
              include: {
                user: true,
                department: true,
                productionLine: true
              }
            }
          }
        }
      }
    });
  }
}
