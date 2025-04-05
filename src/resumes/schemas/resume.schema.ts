import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type ResumeDocument = Resume & Document;

@Schema({ timestamps: true })
export class Resume {
  @Prop({ required: true })
  walletAddress: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  company: string;

  @Prop({ required: true })
  year: number;

  @Prop({ required: true, enum: ["신입", "경력"] })
  experience: string;

  @Prop({ required: true })
  position: string;

  @Prop({ required: true, type: [Object] })
  questions: {
    question: string;
    answer: string;
  }[];

  @Prop({ required: true, default: 0 })
  remainFeedbackCount: number;

  @Prop({ required: true, default: 0 })
  depositAmount: number;

  @Prop()
  depositTransaction: string;

  @Prop({ default: false })
  isDeposited: boolean;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const ResumeSchema = SchemaFactory.createForClass(Resume);
