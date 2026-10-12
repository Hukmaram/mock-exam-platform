import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ExamStatus } from '@prisma/client';

export class CreateExamDto {
  @IsNotEmpty()
  @IsString()
  certificationId: string;

  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  slug: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsInt()
  @Min(1)
  durationMinutes: number;

  @IsInt()
  @Min(1)
  totalQuestions: number;

  @IsNumber()
  @Min(1)
  passingPercentage: number;

  @IsOptional()
  @IsEnum(ExamStatus)
  status?: ExamStatus;

  // Manual question assignment
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  questionIds?: string[];

  // Random selection flag
  @IsOptional()
  @IsBoolean()
  randomSelection?: boolean;
}
