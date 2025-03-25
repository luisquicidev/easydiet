// src/shared/ai/ai.module.ts

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GeminiAIService } from '../services/gemini-ai.service';
import { OpenAIService } from '../services/openai-ai.service';
import { AnthropicAIService } from '../services/anthropic-ai.service';
import { AIServiceFactory } from '../factories/ai-service.factory';

@Module({
    imports: [ConfigModule],
    providers: [
        GeminiAIService,
        OpenAIService,
        AnthropicAIService,
        AIServiceFactory,
    ],
    exports: [
        GeminiAIService,
        OpenAIService,
        AnthropicAIService,
        AIServiceFactory,
    ],
})
export class AIModule {}