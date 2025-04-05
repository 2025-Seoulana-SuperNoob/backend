import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { FeedbacksModule } from "./feedbacks/feedbacks.module";
import { SolanaModule } from "./solana/solana.module";
import { UsersModule } from './users/users.module';
import { ResumesModule } from './resumes/resumes.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),
    FeedbacksModule,
    SolanaModule,
    UsersModule,
    ResumesModule,
  ],
})
export class AppModule {}
