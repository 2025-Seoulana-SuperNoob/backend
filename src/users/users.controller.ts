import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('signup')
  async signup(@Body('walletAddress') walletAddress: string) {
    return this.usersService.signup(walletAddress);
  }

  @Get(':walletAddress')
  async getUserInfo(@Param('walletAddress') walletAddress: string) {
    const userInfo = await this.usersService.getUserInfo(walletAddress);
    if (!userInfo) {
      return { error: 'User not found' };
    }
    return userInfo;
  }
}