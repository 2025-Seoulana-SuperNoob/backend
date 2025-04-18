import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Feedback, FeedbackDocument } from "./schemas/feedback.schema";
import { ConfigService } from "@nestjs/config";
import { GoogleGenAI, Type } from "@google/genai";
import { Resume, ResumeDocument } from "src/resumes/schemas/resume.schema";
import { SolanaService } from "../solana/solana.service";

@Injectable()
export class FeedbacksService {
  private gemini: GoogleGenAI;

  constructor(
    @InjectModel(Feedback.name)
    private feedbackModel: Model<FeedbackDocument>,
    private configService: ConfigService,
    @InjectModel(Resume.name)
    private resumeModel: Model<ResumeDocument>,
    private solanaService: SolanaService
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
    try {
      const resume = await this.resumeModel.findById(resumeId);
      if (resume.remainFeedbackCount <= 0) {
        throw new Error("피드백 개수 초과");
      }

      console.log(walletAddress)

      const feedback = new this.feedbackModel({
        resumeId,
        content,
        walletAddress,
      });

      const result = await this.evaluateFeedbackWithAI(content);
      console.log(result.feedback);

      if (result.approved) {
        resume.remainFeedbackCount--;
        await resume.save();

        try {
          // 보상 전송 시도
          const signature = await this.solanaService.sendReward(
            walletAddress,
            0.000001 // 0.000001 SOL
          );

          // 보상 전송 성공 시 피드백 저장
          feedback.rewardAmount = 0.000001;
          feedback.rewardTransaction = signature;
        } catch (error) {
          console.error('Failed to send reward:', error);
          // 보상 전송 실패 시에도 피드백은 저장
          feedback.rewardAmount = 0;
          feedback.rewardTransaction = 'failed';
        }

        return feedback.save();
      } else {
        throw new Error("답변 검사 불합격");
      }
    } catch (error) {
      console.error('Error in createFeedback:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to create feedback');
    }
  }

  private async evaluateFeedbackWithAI(
    content: string
  ): Promise<{ approved: boolean; feedback: string }> {
    try {
      const response = await this.gemini.models.generateContent({
        model: "gemini-2.0-flash-lite",
        contents: `다음의 피드백을 평가하세요: ${content}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              approved: {
                type: Type.BOOLEAN,
                description:
                  "전체 내용의 길이가 5자 이상이고 자기소개서 피드백과 관련된 내용이면 True, 그렇지 않으면 False 반환.",
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
