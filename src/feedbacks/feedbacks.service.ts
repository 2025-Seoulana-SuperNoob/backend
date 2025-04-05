import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Feedback, FeedbackDocument } from "./schemas/feedback.schema";
import { ConfigService } from "@nestjs/config";
import { GoogleGenAI, Type } from "@google/genai";

@Injectable()
export class FeedbacksService {
  private gemini: GoogleGenAI;

  constructor(
    @InjectModel(Feedback.name)
    private feedbackModel: Model<FeedbackDocument>,
    private configService: ConfigService
  ) {
    this.gemini = new GoogleGenAI({
      apiKey: this.configService.get<string>("GEMINI_API_KEY"),
    });
  }

  async createFeedback(
    resumeId: string,
    content: string,
    index: number,
    walletAddress: string
  ): Promise<Feedback> {
    const feedback = new this.feedbackModel({
      resumeId,
      content,
      index,
      walletAddress,
      status: "pending",
    });
    var result = await this.evaluateFeedbackWithAI(content);
    if (result.approved) {
      return feedback.save();
    } else {
      throw new Error("답변 검사 불합격");
    }
  }

  private async evaluateFeedbackWithAI(
    content: string
  ): Promise<{ approved: boolean; feedback: string }> {
    try {
      const response = await this.gemini.models.generateContent({
        model: "gemini-2.0-flash-lite",
        contents: `다음 피드백을 평가하세요: ${content}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              approved: {
                type: Type.BOOLEAN,
                description:
                  "피드백이 관련성이 있고, 너무 짧지 않고 (최소 10자 이상), 부적절한 내용이 포함되어 있지 않으면 True. 그렇지 않으면 False.",
                nullable: false,
              },
              reason: {
                type: Type.STRING,
                description:
                  "피드백을 승인하지 않은 간략한 이유. approved가 true이면 빈 문자열이어야 합니다.",
                nullable: true,
              },
            },
            required: ["approved"],
          },
        },
      });

      const result = JSON.parse(response.text);

      return {
        approved: result.approved,
        feedback: result.approved
          ? "피드백이 유용합니다."
          : result.reason || "AI 평가 실패", // reason이 없을 경우를 대비
      };
    } catch (error) {
      console.error("AI 평가 오류:", error);
      return { approved: false, feedback: "AI 평가 실패" };
    }
  }

  async approveFeedback(feedbackId: string): Promise<Feedback> {
    const feedback = await this.feedbackModel.findById(feedbackId);
    if (!feedback) {
      throw new Error("Feedback not found");
    }

    feedback.status = "approved";
    return feedback.save();
  }

  async getFeedback(id: string): Promise<Feedback> {
    return this.feedbackModel.findById(id);
  }

  async getFeedbacksBySelfIntroduction(
    selfIntroductionId: string
  ): Promise<Feedback[]> {
    return this.feedbackModel.find({ selfIntroductionId });
  }

  async findFeedbacks(resumeId: string): Promise<Feedback[]> {
    return this.feedbackModel.find({ resumeId }).sort({ createdAt: -1 }).exec();
  }
}
