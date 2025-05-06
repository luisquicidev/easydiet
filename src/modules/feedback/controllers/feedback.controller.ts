import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { MealFeedbackService } from '../services/meal-feedback.service';
import { DailyFeedbackService } from '../services/daily-feedback.service';
import { FeedbackPatternsService } from '../services/feedback-patterns.service';
import { CreateMealFeedbackDto } from '../dto/create-meal-feedback.dto';
import { UpdateMealFeedbackDto } from '../dto/update-meal-feedback.dto';
import { CreateDailyFeedbackSummaryDto } from '../dto/daily-feedback-summary.dto';
import { CreateFeedbackPatternDto } from '../dto/feedback-pattern.dto';
import { UpdateFeedbackPatternDto } from '../dto/feedback-pattern.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { User } from '../../auth/decorators/user.decorator';

@Controller('feedback')
@UseGuards(JwtAuthGuard)
export class FeedbackController {
  constructor(
    private readonly mealFeedbackService: MealFeedbackService,
    private readonly dailyFeedbackService: DailyFeedbackService,
    private readonly feedbackPatternsService: FeedbackPatternsService,
  ) {}

  // Endpoints para feedback de refeições
  @Post('meals')
  createMealFeedback(
    @User('id') userId: string,
    @Body() createMealFeedbackDto: CreateMealFeedbackDto,
  ) {
    return this.mealFeedbackService.create(createMealFeedbackDto);
  }

  @Get('meals')
  findAllMealFeedbacks(
    @User('id') userId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    if (startDate && endDate) {
      return this.mealFeedbackService.findByDateRange(
        userId,
        new Date(startDate),
        new Date(endDate),
      );
    }
    return this.mealFeedbackService.findAll(userId);
  }

  @Get('meals/:id')
  findOneMealFeedback(@Param('id') id: string) {
    return this.mealFeedbackService.findOne(id);
  }

  @Patch('meals/:id')
  updateMealFeedback(
    @Param('id') id: string,
    @Body() updateMealFeedbackDto: UpdateMealFeedbackDto,
  ) {
    return this.mealFeedbackService.update(id, updateMealFeedbackDto);
  }

  @Delete('meals/:id')
  removeMealFeedback(@Param('id') id: string) {
    return this.mealFeedbackService.remove(id);
  }

  // Endpoints para feedback diário
  @Post('daily')
  createDailyFeedback(
    @User('id') userId: string,
    @Body() dailyFeedbackSummaryDto: CreateDailyFeedbackSummaryDto,
  ) {
    return this.dailyFeedbackService.create(dailyFeedbackSummaryDto);
  }

  @Get('daily')
  findAllDailyFeedbacks(
    @User('id') userId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    if (startDate && endDate) {
      return this.dailyFeedbackService.findByDateRange(
        userId,
        new Date(startDate),
        new Date(endDate),
      );
    }
    return this.dailyFeedbackService.findByDateRange(userId, new Date(), new Date());
  }

  @Get('daily/:id')
  findOneDailyFeedback(@Param('id') id: string) {
    return this.dailyFeedbackService.findOne(id);
  }

  @Patch('daily/:id')
  updateDailyFeedback(
    @Param('id') id: string,
    @Body() dailyFeedbackSummaryDto: CreateDailyFeedbackSummaryDto,
  ) {
    return this.dailyFeedbackService.update(id, dailyFeedbackSummaryDto);
  }

  @Delete('daily/:id')
  removeDailyFeedback(@Param('id') id: string) {
    return this.dailyFeedbackService.findOne(id);
  }

  @Post('daily/generate')
  generateDailyFeedback(
    @User('id') userId: string,
    @Query('date') date: string,
  ) {
    return this.dailyFeedbackService.generateDailySummary(userId, new Date(date));
  }

  // Endpoints para padrões de feedback
  @Post('patterns')
  createFeedbackPattern(
    @User('id') userId: string,
    @Body() createFeedbackPatternDto: CreateFeedbackPatternDto,
  ) {
    return this.feedbackPatternsService.create(createFeedbackPatternDto);
  }

  @Get('patterns')
  findAllFeedbackPatterns(@User('id') userId: string) {
    return this.feedbackPatternsService.findAll(userId);
  }

  @Get('patterns/:id')
  findOneFeedbackPattern(@Param('id') id: string) {
    return this.feedbackPatternsService.findOne(id);
  }

  @Patch('patterns/:id')
  updateFeedbackPattern(
    @Param('id') id: string,
    @Body() updateFeedbackPatternDto: UpdateFeedbackPatternDto,
  ) {
    return this.feedbackPatternsService.update(id, updateFeedbackPatternDto);
  }

  @Delete('patterns/:id')
  removeFeedbackPattern(@Param('id') id: string) {
    return this.feedbackPatternsService.remove(id);
  }

  @Post('patterns/analyze')
  analyzeFeedbackPatterns(
    @User('id') userId: string,
    @Query('days') days?: number,
  ) {
    return this.feedbackPatternsService.analyzePatterns(userId, days);
  }
} 