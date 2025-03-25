import { Controller, Post, Body, Put, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
    constructor(private usersService: UsersService) {}

    @Post('register')
    async register(@Body() registerDto: { email: string; password: string, name: string }) {
        return this.usersService.createUser(registerDto.email, registerDto.password, registerDto.name);
    }

    @Put('password')
    async updatePassword(
        @Request() req,
        @Body() passwordData: { currentPassword: string; newPassword: string }
    ) {
        return this.usersService.updatePassword(
            req.user.userId,
            passwordData.currentPassword,
            passwordData.newPassword
        );
    }
}