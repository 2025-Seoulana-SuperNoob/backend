import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Resume, ResumeDocument } from './schemas/resume.schema';

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

  async findAllByWalletAddress(walletAddress: string) {
    return this.resumeModel.find({ walletAddress }).sort({ createdAt: -1 });
  }

  async findOne(id: string) {
    return this.resumeModel.findById(id);
  }
}