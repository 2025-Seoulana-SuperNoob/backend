import { Controller, Post, Body, Get, Param, Query } from '@nestjs/common';
import { ResumesService } from './resumes.service';
import { PaginatedResult } from './interfaces/paginated-result.interface';
import { Resume } from './schemas/resume.schema';

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
      questions
    );
  }

  @Get()
  async findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ): Promise<PaginatedResult<Resume>> {
    return this.resumesService.findAll(
      parseInt(page),
      parseInt(limit),
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.resumesService.findOne(id);
  }
}