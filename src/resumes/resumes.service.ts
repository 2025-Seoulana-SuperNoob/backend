import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Resume, ResumeDocument } from './schemas/resume.schema';
import { PaginatedResult } from './interfaces/paginated-result.interface';

@Injectable()
export class ResumesService {
  constructor(
    @InjectModel(Resume.name) private resumeModel: Model<ResumeDocument>,
  ) {}

  async create(
    walletAddress: string,
    title: string,
    company: string,
    year: number,
    experience: string,
    position: string,
    questions: { question: string; answer: string }[],
  ) {
    const resume = new this.resumeModel({
      walletAddress,
      title,
      company,
      year,
      experience,
      position,
      questions,
    });

    return resume.save();
  }

  async findAll(page: number = 1, limit: number = 10): Promise<PaginatedResult<Resume>> {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.resumeModel
        .find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.resumeModel.countDocuments(),
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
    limit: number = 10,
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
}