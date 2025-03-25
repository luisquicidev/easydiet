import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
    ) {}

    async createUser(email: string, password: string, name: string): Promise<User> {
        const existingUser = await this.findByEmail(email);

        if (existingUser) {
            throw new BadRequestException('Email already exists');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = this.usersRepository.create({
            email,
            password: hashedPassword,
            name
        });

        // Uso de type assertion para corrigir o erro de tipagem
        return this.usersRepository.save(user) as unknown as Promise<User>;
    }

    async findByEmail(email: string): Promise<User | null> {
        return this.usersRepository.findOne({ where: { email } });
    }

    async findById(id: number): Promise<User | null> {
        return this.usersRepository.findOne({ where: { id } });
    }

    async updatePassword(userId: number, currentPassword: string, newPassword: string): Promise<User> {
        const user = await this.findById(userId);

        if (!user) {
            throw new NotFoundException('User not found');
        }

        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

        if (!isPasswordValid) {
            throw new BadRequestException('Current password is incorrect');
        }

        user.password = await bcrypt.hash(newPassword, 10);
        return this.usersRepository.save(user) as unknown as Promise<User>;
    }

    async updateRefreshToken(userId: number, refreshToken: string | null): Promise<void> {
        const hashedRefreshToken = refreshToken ? await bcrypt.hash(refreshToken, 10) : null;

        // Usar uma string vazia em vez de null quando o refreshToken for null
        await this.usersRepository.update(userId, {
            refreshToken: hashedRefreshToken || '', // Use string vazia como fallback
        });
    }
}