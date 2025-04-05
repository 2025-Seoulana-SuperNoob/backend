import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  Keypair,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class SolanaService {
  private connection: Connection;
  private senderKeypair: Keypair;
  private readonly MAX_RETRIES = 3;
  private readonly TIMEOUT = 7000; // 7 seconds

  constructor(private configService: ConfigService) {
    this.connection = new Connection(
      this.configService.get<string>("SOLANA_RPC_URL") ||
        "https://api.devnet.solana.com",
      "confirmed"
    );

    // 개발 환경에서만 사용
    const secretKey = JSON.parse(
      fs.readFileSync(path.join(__dirname, '../../phantom.json'), 'utf-8')
    );
    this.senderKeypair = Keypair.fromSecretKey(new Uint8Array(secretKey));
  }

  async createEscrowAccount(
    fromPublicKey: string,
    amount: number
  ): Promise<{ escrowAccount: string; transaction: string }> {
    const fromPubkey = new PublicKey(fromPublicKey);
    const [escrowAccount] = await PublicKey.findProgramAddress(
      [Buffer.from("escrow"), fromPubkey.toBuffer()],
      new PublicKey(this.configService.get<string>("PROGRAM_ID"))
    );

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey,
        toPubkey: escrowAccount,
        lamports: amount * LAMPORTS_PER_SOL,
      })
    );

    return {
      escrowAccount: escrowAccount.toString(),
      transaction: transaction.serialize().toString("base64"),
    };
  }

  async distributeReward(
    escrowAccount: string,
    toPublicKey: string,
    amount: number
  ): Promise<{ transaction: string }> {
    const escrowPubkey = new PublicKey(escrowAccount);
    const toPubkey = new PublicKey(toPublicKey);

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: escrowPubkey,
        toPubkey,
        lamports: amount * LAMPORTS_PER_SOL,
      })
    );

    return {
      transaction: transaction.serialize().toString("base64"),
    };
  }

  async getBalance(publicKey: string): Promise<number> {
    const pubkey = new PublicKey(publicKey);
    const balance = await this.connection.getBalance(pubkey);
    return balance / LAMPORTS_PER_SOL;
  }

  async sendReward(toAddress: string, amountSol: number): Promise<string> {
    // 타임아웃 설정
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Transaction timeout')), this.TIMEOUT)
    );

    let retries = 0;
    let lastError: Error | null = null;

    while (retries < this.MAX_RETRIES) {
      try {
        const recipient = new PublicKey(toAddress);
        const tx = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: this.senderKeypair.publicKey,
            toPubkey: recipient,
            lamports: amountSol * 1e9,
          })
        );

        const signature = await Promise.race([
          sendAndConfirmTransaction(
            this.connection,
            tx,
            [this.senderKeypair],
            { commitment: 'confirmed' }
          ),
          timeoutPromise
        ]);

        return signature as string;
      } catch (error) {
        lastError = error as Error;
        console.error(`Reward transfer attempt ${retries + 1} failed:`, error);
        retries++;

        if (retries < this.MAX_RETRIES) {
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, retries) * 1000));
        }
      }
    }

    throw new Error(`Failed to send reward after ${this.MAX_RETRIES} attempts: ${lastError?.message}`);
  }
}
