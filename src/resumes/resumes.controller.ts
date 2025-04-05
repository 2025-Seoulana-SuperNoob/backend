import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { ResumesService } from './resumes.service';

@Controller('resumes')
export class ResumesController {
  constructor(private readonly resumesService: ResumesService) {}

  @Post()
  async create(
    @Body('walletAddress') walletAddress: string,
    @Body('title') title: string,
    @Body('company') company: string,
    @Body('year') year: number,
    @Body('experience') experience: string,
    @Body('position') position: string,
    @Body('questions') questions: { question: string; answer: string }[],
  ) {
    return this.resumesService.create(
      walletAddress,
      title,
      company,
      year,
      experience,
      position,
      questions,
    );
  }

  @Get('wallet/:walletAddress')
  async findAllByWalletAddress(@Param('walletAddress') walletAddress: string) {
    return this.resumesService.findAllByWalletAddress(walletAddress);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.resumesService.findOne(id);
  }
}