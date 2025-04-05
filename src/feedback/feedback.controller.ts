import { Controller, Get, Post, Body, Param, UseGuards } from "@nestjs/common";
import { FeedbackService } from "./feedback.service";
import { CreateSelfIntroductionDto } from "./dto/create-self-introduction.dto";
import { CreateFeedbackDto } from "./dto/create-feedback.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@Controller("feedback")
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post("self-introduction")
  @UseGuards(JwtAuthGuard)
  async createSelfIntroduction(
    @Body() createSelfIntroductionDto: CreateSelfIntroductionDto
  ) {
    return this.feedbackService.createSelfIntroduction(
      createSelfIntroductionDto.userId,
      createSelfIntroductionDto.content,
      createSelfIntroductionDto.targetFeedbackCount,
      createSelfIntroductionDto.depositAmount
    );
  }

  @Post(":selfIntroductionId/feedback")
  @UseGuards(JwtAuthGuard)
  async createFeedback(
    @Param("selfIntroductionId") selfIntroductionId: string,
    @Body() createFeedbackDto: CreateFeedbackDto
  ) {
    return this.feedbackService.createFeedback(
      selfIntroductionId,
      createFeedbackDto.userId,
      createFeedbackDto.content
    );
  }

  @Post("feedback/:id/approve")
  @UseGuards(JwtAuthGuard)
  async approveFeedback(@Param("id") id: string) {
    return this.feedbackService.approveFeedback(id);
  }

  @Get("self-introduction/:id")
  async getSelfIntroduction(@Param("id") id: string) {
    return this.feedbackService.getSelfIntroduction(id);
  }

  @Get("feedback/:id")
  async getFeedback(@Param("id") id: string) {
    return this.feedbackService.getFeedback(id);
  }

  @Get("self-introduction/:id/feedbacks")
  async getFeedbacksBySelfIntroduction(@Param("id") id: string) {
    return this.feedbackService.getFeedbacksBySelfIntroduction(id);
  }
}
