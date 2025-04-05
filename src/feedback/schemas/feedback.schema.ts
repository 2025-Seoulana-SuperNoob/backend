import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type FeedbackDocument = Feedback & Document;

@Schema({ timestamps: true })
export class Feedback {
  @Prop({ required: true })
  selfIntroductionId: string;

  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  content: string;

  @Prop({ required: true, default: 'pending' })
  status: 'pending' | 'approved' | 'rejected';

  @Prop({ default: false })
  isAIApproved: boolean;

  @Prop()
  aiFeedback: string;

  @Prop()
  rewardAmount: number;

  @Prop()
  rewardTransaction: string;
}

export const FeedbackSchema = SchemaFactory.createForClass(Feedback); 