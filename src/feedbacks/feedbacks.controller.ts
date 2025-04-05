import { Controller, Get, Post, Body, Param } from "@nestjs/common";
import { FeedbacksService } from "./feedbacks.service";
import { Feedback } from "./schemas/feedback.schema";

@Controller("resumes")
export class FeedbacksController {
  constructor(private readonly feedbacksService: FeedbacksService) {}

  @Get(":id/feedback")
  async findFeedbacks(@Param("id") id: string): Promise<Feedback[]> {
    return this.feedbacksService.findFeedbacks(id);
  }

  @Post(":id/feedback")
  async createFeedback(
    @Param("id") id: string,
    @Body("content") content: string,
    @Body("walletAddress") walletAddress: string
  ): Promise<Feedback> {
    return this.feedbacksService.createFeedback(
      id,
      content,
      walletAddress
    );
  }
}
