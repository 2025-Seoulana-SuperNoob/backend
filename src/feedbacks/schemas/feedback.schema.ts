import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type FeedbackDocument = Feedback & Document;

@Schema({ timestamps: true })
export class Feedback {
  @Prop({ required: true })
  resumeId: string;

  @Prop({ required: true })
  content: string;

  @Prop({ required: true })
  walletAddress: string;

  @Prop()
  rewardAmount: number;

  @Prop()
  rewardTransaction: string;
}

export const FeedbackSchema = SchemaFactory.createForClass(Feedback);
