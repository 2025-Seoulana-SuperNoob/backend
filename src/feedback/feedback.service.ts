import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SelfIntroduction, SelfIntroductionDocument } from './schemas/self-introduction.schema';
import { Feedback, FeedbackDocument } from './schemas/feedback.schema';
import { OpenAI } from 'openai';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FeedbackService {
  private openai: OpenAI;

  constructor(
    @InjectModel(SelfIntroduction.name)
    private selfIntroductionModel: Model<SelfIntroductionDocument>,
    @InjectModel(Feedback.name)
    private feedbackModel: Model<FeedbackDocument>,
    private configService: ConfigService,
  ) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
  }

  async createSelfIntroduction(
    userId: string,
    content: string,
    targetFeedbackCount: number,
    depositAmount: number,
  ): Promise<SelfIntroduction> {
    const selfIntroduction = new this.selfIntroductionModel({
      userId,
      content,
      targetFeedbackCount,
      depositAmount,
      status: 'pending',
    });
    return selfIntroduction.save();
  }

  async createFeedback(
    selfIntroductionId: string,
    userId: string,
    content: string,
  ): Promise<Feedback> {
    const feedback = new this.feedbackModel({
      selfIntroductionId,
      userId,
      content,
      status: 'pending',
    });

    // AI 평가 수행
    const aiEvaluation = await this.evaluateFeedbackWithAI(content);
    feedback.isAIApproved = aiEvaluation.approved;
    feedback.aiFeedback = aiEvaluation.feedback;

    return feedback.save();
  }

  private async evaluateFeedbackWithAI(content: string): Promise<{ approved: boolean; feedback: string }> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that evaluates feedback on self-introduction letters. Provide constructive feedback and determine if the feedback is helpful (Yes/No).',
          },
          {
            role: 'user',
            content: `Evaluate this feedback: ${content}`,
          },
        ],
      });

      const evaluation = response.choices[0].message.content;
      const approved = evaluation.toLowerCase().includes('yes');
      return { approved, feedback: evaluation };
    } catch (error) {
      console.error('AI evaluation error:', error);
      return { approved: false, feedback: 'AI evaluation failed' };
    }
  }

  async approveFeedback(feedbackId: string): Promise<Feedback> {
    const feedback = await this.feedbackModel.findById(feedbackId);
    if (!feedback) {
      throw new Error('Feedback not found');
    }

    feedback.status = 'approved';
    return feedback.save();
  }

  async getSelfIntroduction(id: string): Promise<SelfIntroduction> {
    return this.selfIntroductionModel.findById(id);
  }

  async getFeedback(id: string): Promise<Feedback> {
    return this.feedbackModel.findById(id);
  }

  async getFeedbacksBySelfIntroduction(selfIntroductionId: string): Promise<Feedback[]> {
    return this.feedbackModel.find({ selfIntroductionId });
  }
} 