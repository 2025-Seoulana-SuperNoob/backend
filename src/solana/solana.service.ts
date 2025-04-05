import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';

@Injectable()
export class SolanaService {
  private connection: Connection;

  constructor(private configService: ConfigService) {
    this.connection = new Connection(
      this.configService.get<string>('SOLANA_RPC_URL') || 'https://api.devnet.solana.com',
      'confirmed',
    );
  }

  async createEscrowAccount(
    fromPublicKey: string,
    amount: number,
  ): Promise<{ escrowAccount: string; transaction: string }> {
    const fromPubkey = new PublicKey(fromPublicKey);
    const [escrowAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from('escrow'), fromPubkey.toBuffer()],
      new PublicKey('YourProgramId') // Replace with your actual program ID
    );

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey,
        toPubkey: escrowAccount,
        lamports: amount * LAMPORTS_PER_SOL,
      }),
    );

    return {
      escrowAccount: escrowAccount.toString(),
      transaction: transaction.serialize().toString('base64'),
    };
  }

  async distributeReward(
    escrowAccount: string,
    toPublicKey: string,
    amount: number,
  ): Promise<{ transaction: string }> {
    const escrowPubkey = new PublicKey(escrowAccount);
    const toPubkey = new PublicKey(toPublicKey);

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: escrowPubkey,
        toPubkey,
        lamports: amount * LAMPORTS_PER_SOL,
      }),
    );

    return {
      transaction: transaction.serialize().toString('base64'),
    };
  }

  async getBalance(publicKey: string): Promise<number> {
    const pubkey = new PublicKey(publicKey);
    const balance = await this.connection.getBalance(pubkey);
    return balance / LAMPORTS_PER_SOL;
  }
}