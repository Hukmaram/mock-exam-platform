import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ExamStatus } from '@prisma/client';

export class UpdateExamDto {
  @IsOptional()
  @IsString()
  certificationId?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  durationMinutes?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  totalQuestions?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  passingPercentage?: number;

  @IsOptional()
  @IsEnum(ExamStatus)
  status?: ExamStatus;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  questionIds?: string[];

  @IsOptional()
  @IsBoolean()
  randomSelection?: boolean;
}
