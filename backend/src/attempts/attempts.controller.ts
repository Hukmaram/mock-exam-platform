import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AttemptsService } from './attempts.service';
import { StartAttemptDto } from './dto/start-attempt.dto';
import { SaveAnswerDto } from './dto/save-answer.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

@Controller('attempts')
export class AttemptsController {
  constructor(private readonly attemptsService: AttemptsService) {}

  @Post()
  async startAttempt(
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') role: string,
    @Body() dto: StartAttemptDto,
  ) {
    return this.attemptsService.startAttempt(userId, role, dto);
  }

  @Get('my')
  async getMyAttempts(@CurrentUser('userId') userId: string) {
    return this.attemptsService.listUserAttempts(userId);
  }

  @Get('admin/all')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async getAllAttempts(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.attemptsService.listAllAttempts(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get(':id')
  async getAttempt(
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') role: string,
    @Param('id') attemptId: string,
  ) {
    const isAdmin = role === 'ADMIN';
    return this.attemptsService.getAttempt(userId, attemptId, isAdmin);
  }

  @Post(':id/answers')
  async saveAnswer(
    @CurrentUser('userId') userId: string,
    @Param('id') attemptId: string,
    @Body() dto: SaveAnswerDto,
  ) {
    return this.attemptsService.saveAnswer(userId, attemptId, dto);
  }

  @Post(':id/submit')
  async submitAttempt(
    @CurrentUser('userId') userId: string,
    @Param('id') attemptId: string,
  ) {
    return this.attemptsService.submitAttempt(userId, attemptId);
  }

  @Get(':id/result')
  async getResult(
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') role: string,
    @Param('id') attemptId: string,
  ) {
    const isAdmin = role === 'ADMIN';
    return this.attemptsService.getResult(userId, attemptId, isAdmin);
  }
}
