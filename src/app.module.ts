import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { FeedbackModule } from "./feedback/feedback.module";
import { SolanaModule } from "./solana/solana.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRoot(
      process.env.MONGODB_URI || "mongodb://localhost:27017/supernoob"
    ),
    FeedbackModule,
    SolanaModule,
  ],
})
export class AppModule {}
