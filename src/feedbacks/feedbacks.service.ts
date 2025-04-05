import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Feedback, FeedbackDocument } from "./schemas/feedback.schema";
import { ConfigService } from "@nestjs/config";
import { GoogleGenAI, Type } from "@google/genai";
import { Resume, ResumeDocument } from "src/resumes/schemas/resume.schema";

@Injectable()
export class FeedbacksService {
  private gemini: GoogleGenAI;

  constructor(
    @InjectModel(Feedback.name)
    private feedbackModel: Model<FeedbackDocument>,
    private configService: ConfigService,
    @InjectModel(Resume.name)
    private resumeModel: Model<ResumeDocument>
  ) {
    this.gemini = new GoogleGenAI({
      apiKey: this.configService.get<string>("GEMINI_API_KEY"),
    });
  }

  async createFeedback(
    resumeId: string,
    content: string,
    walletAddress: string
  ): Promise<Feedback> {
    const resume = await this.resumeModel.findById(resumeId);
    if (resume.remainFeedbackCount <= 0) {
      throw new Error("피드백 개수 초과");
    }
    const feedback = new this.feedbackModel({
      resumeId,
      content,
      walletAddress,
    });
    var result = await this.evaluateFeedbackWithAI(content);
    if (result.approved) {
      resume.remainFeedbackCount--;
      await resume.save();
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
                  "길이가 최소 5자 이상이고 자기소개서 피드백과 관련된 내용이면 True. 그렇지 않으면 False.",
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
