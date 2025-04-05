import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SelfIntroductionDocument = SelfIntroduction & Document;

@Schema({ timestamps: true })
export class SelfIntroduction {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  content: string;

  @Prop({ required: true, default: 0 })
  targetFeedbackCount: number;

  @Prop({ required: true, default: 0 })
  currentFeedbackCount: number;

  @Prop({ required: true })
  depositAmount: number;

  @Prop({ required: true, default: 'pending' })
  status: 'pending' | 'active' | 'completed' | 'cancelled';

  @Prop()
  escrowAccount: string;
}

export const SelfIntroductionSchema = SchemaFactory.createForClass(SelfIntroduction); 