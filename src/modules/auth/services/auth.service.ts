import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../../users/controllers/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
    ) {}

    async validateUser(email: string, pass: string): Promise<any> {
        const user = await this.usersService.findByEmail(email);
        if (user && await bcrypt.compare(pass, user.password)) {
            const { password, ...result } = user;
            return result;
        }
        return null;
    }

    async login(user: any) {
        const payload = { email: user.email, sub: user.id };
        const refreshToken = this.jwtService.sign(payload, {
            expiresIn: '7d',
        });

        await this.usersService.updateRefreshToken(user.id, refreshToken);

        return {
            access_token: this.jwtService.sign(payload),
            refresh_token: refreshToken,
        };
    }

    async refreshToken(userId: number, refreshToken: string) {
        const user = await this.usersService.findById(userId);

        if (!user || !user.refreshToken) {
            throw new UnauthorizedException('Invalid refresh token');
        }

        const refreshTokenMatches = await bcrypt.compare(
            refreshToken,
            user.refreshToken,
        );

        if (!refreshTokenMatches) {
            throw new UnauthorizedException('Invalid refresh token');
        }

        const payload = { email: user.email, sub: user.id };
        return {
            access_token: this.jwtService.sign(payload),
        };
    }

    async logout(userId: number) {
        await this.usersService.updateRefreshToken(userId, null);
        return { message: 'Logout successful' };
    }
}