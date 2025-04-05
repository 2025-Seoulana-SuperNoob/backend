import { IsString, IsNumber, IsNotEmpty, Min } from 'class-validator';

export class CreateSelfIntroductionDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsNumber()
  @Min(1)
  targetFeedbackCount: number;

  @IsNumber()
  @Min(0)
  depositAmount: number;
} 