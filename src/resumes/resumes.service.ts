import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Resume, ResumeDocument } from "./schemas/resume.schema";
import { PaginatedResult } from "./interfaces/paginated-result.interface";
import { Connection, PublicKey } from "@solana/web3.js";

@Injectable()
export class ResumesService {
  private connection: Connection;

  constructor(
    @InjectModel(Resume.name) private resumeModel: Model<ResumeDocument>
  ) {
    this.connection = new Connection("https://api.devnet.solana.com");
  }

  async create(
    walletAddress: string,
    title: string,
    company: string,
    year: number,
    experience: string,
    position: string,
    questions: { question: string; answer: string }[],
	depositAmount: number,
	depositTransaction: string
  ) {
	const tx = await this.connection.getTransaction(depositTransaction);
    if (!tx) {
      throw new Error("유효하지 않은 트랜잭션입니다.");
    }

    // 예치금 확인
    const expectedLamports = depositAmount * 1e9; // SOL to lamports
    const actualLamports = tx.meta?.postBalances[1] - tx.meta?.preBalances[1];

    if (actualLamports !== expectedLamports) {
      throw new Error("예치금 금액이 일치하지 않습니다.");
    }

    // 수신자 주소 확인
    const programId = new PublicKey("YOUR_PROGRAM_ID");
    if (!tx.transaction.message.accountKeys.some(key => key.equals(programId))) {
      throw new Error("잘못된 수신자 주소입니다.");
    }

    const resume = new this.resumeModel({
		walletAddress,
		title,
		company,
		year,
		experience,
		position,
		questions,
      depositAmount,
      depositTransaction,
      isDeposited: true,
    });

    return resume.save();
  }

  async findAll(
    page: number = 1,
    limit: number = 10
  ): Promise<PaginatedResult<Resume>> {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.resumeModel
        .find({ remainFeedbackCount: { $gt: 0 } })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.resumeModel.countDocuments({ remainFeedbackCount: { $gt: 0 } }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findAllByWalletAddress(
    walletAddress: string,
    page: number = 1,
    limit: number = 10
  ): Promise<PaginatedResult<Resume>> {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.resumeModel
        .find({ walletAddress })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.resumeModel.countDocuments({ walletAddress }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    return this.resumeModel.findById(id);
  }

  async createResume(
    content: string,
    walletAddress: string,
    depositAmount: number,
    depositTransaction: string
  ): Promise<Resume> {
    // 트랜잭션 검증
    const tx = await this.connection.getTransaction(depositTransaction);
    if (!tx) {
      throw new Error("유효하지 않은 트랜잭션입니다.");
    }

    // 예치금 확인
    const expectedLamports = depositAmount * 1e9; // SOL to lamports
    const actualLamports = tx.meta?.postBalances[1] - tx.meta?.preBalances[1];

    if (actualLamports !== expectedLamports) {
      throw new Error("예치금 금액이 일치하지 않습니다.");
    }

    // 수신자 주소 확인
    const programId = new PublicKey("YOUR_PROGRAM_ID");
    if (!tx.transaction.message.accountKeys.some(key => key.equals(programId))) {
      throw new Error("잘못된 수신자 주소입니다.");
    }

    const resume = new this.resumeModel({
      content,
      walletAddress,
      depositAmount,
      depositTransaction,
      isDeposited: true,
      remainFeedbackCount: 3, // 선착순 3명에게 피드백 보상
    });

    return resume.save();
  }
}
