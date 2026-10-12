import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { QuestionsService } from './questions.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { QueryQuestionsDto } from './dto/query-questions.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { QuestionStatus } from '@prisma/client';

@Controller('questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Get()
  async findAll(
    @Query() query: QueryQuestionsDto,
    @CurrentUser('role') role?: string,
  ) {
    const isAdmin = role === 'ADMIN';
    return this.questionsService.findAll(query, isAdmin);
  }

  @Get(':id')
  async findById(
    @Param('id') id: string,
    @CurrentUser('role') role?: string,
  ) {
    const isAdmin = role === 'ADMIN';
    return this.questionsService.findById(id, isAdmin);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async create(@Body() dto: CreateQuestionDto) {
    return this.questionsService.create(dto);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async update(@Param('id') id: string, @Body() dto: UpdateQuestionDto) {
    return this.questionsService.update(id, dto);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: QuestionStatus,
  ) {
    if (!status) {
      throw new BadRequestException('Status is required');
    }
    return this.questionsService.updateStatus(id, status);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async delete(@Param('id') id: string) {
    return this.questionsService.delete(id);
  }

  @Post('import')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @UseInterceptors(FileInterceptor('file'))
  async importFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('certificationId') certificationId: string,
    @Body('format') format: 'csv' | 'json',
    @Body('domainId') domainId?: string,
    @Body('rawContent') rawContent?: string,
  ) {
    if (!certificationId) {
      throw new BadRequestException('certificationId is required');
    }

    let buffer: Buffer;
    let resolvedFormat = format || 'json';

    if (file) {
      buffer = file.buffer;
      if (file.originalname.endsWith('.csv')) {
        resolvedFormat = 'csv';
      } else if (file.originalname.endsWith('.json')) {
        resolvedFormat = 'json';
      }
    } else if (rawContent) {
      buffer = Buffer.from(rawContent, 'utf-8');
    } else {
      throw new BadRequestException('Either a file or rawContent must be provided');
    }

    return this.questionsService.importQuestions(
      certificationId,
      buffer,
      resolvedFormat,
      domainId,
    );
  }
}
