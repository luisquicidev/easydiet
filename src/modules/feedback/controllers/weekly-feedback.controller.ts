import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { WeeklyFeedbackService } from '../services/weekly-feedback.service';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import { User } from '../../../shared/decorators/user.decorator';

@Controller('feedback/weekly')
@UseGuards(JwtAuthGuard)
export class WeeklyFeedbackController {
  constructor(private readonly weeklyFeedbackService: WeeklyFeedbackService) {}

  @Post()
  async create(@Body() createDto: any, @User('id') userId: string) {
    return this.weeklyFeedbackService.create({ ...createDto, user_id: userId });
  }

  @Get()
  async findAll(
    @User('id') userId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.weeklyFeedbackService.findAll(
      userId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.weeklyFeedbackService.findOne(id);
  }
} 