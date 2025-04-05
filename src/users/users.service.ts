import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async signup(walletAddress: string) {
    const existingUser = await this.userModel.findOne({ walletAddress });
    if (existingUser) {
      return existingUser;
    }

    const user = new this.userModel({
      walletAddress,
      nickname: walletAddress, // 초기 닉네임을 지갑 주소로 설정
    });

    return user.save();
  }

  async findByWalletAddress(walletAddress: string) {
    return this.userModel.findOne({ walletAddress });
  }
}