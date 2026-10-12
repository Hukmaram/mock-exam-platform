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
} from '@nestjs/common';
import { ExamsService } from './exams.service';
import { CreateExamDto } from './dto/create-exam.dto';
import { UpdateExamDto } from './dto/update-exam.dto';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ExamStatus } from '@prisma/client';

@Controller('exams')
export class ExamsController {
  constructor(private readonly examsService: ExamsService) {}

  @Public()
  @Get()
  async findAll(
    @Query('certificationId') certId?: string,
    @CurrentUser('role') role?: string,
  ) {
    const isAdmin = role === 'ADMIN';
    return this.examsService.findAll(certId, isAdmin);
  }

  @Public()
  @Get(':id')
  async findById(
    @Param('id') id: string,
    @CurrentUser('role') role?: string,
  ) {
    const isAdmin = role === 'ADMIN';
    return this.examsService.findById(id, isAdmin);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async create(@Body() dto: CreateExamDto) {
    return this.examsService.create(dto);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async update(@Param('id') id: string, @Body() dto: UpdateExamDto) {
    return this.examsService.update(id, dto);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: ExamStatus,
  ) {
    return this.examsService.updateStatus(id, status);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async delete(@Param('id') id: string) {
    return this.examsService.delete(id);
  }
}
