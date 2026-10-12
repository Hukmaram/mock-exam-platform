import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { QuestionType, Difficulty, QuestionStatus } from '@prisma/client';

export class CreateQuestionOptionDto {
  @IsNotEmpty()
  @IsString()
  key: string; // A, B, C, D

  @IsNotEmpty()
  @IsString()
  text: string;

  @IsBoolean()
  isCorrect: boolean;

  @IsOptional()
  @IsString()
  explanation?: string;
}

export class CreateQuestionDto {
  @IsNotEmpty()
  @IsString()
  certificationId: string;

  @IsNotEmpty()
  @IsString()
  domainId: string;

  @IsNotEmpty()
  @IsString()
  text: string;

  @IsEnum(QuestionType)
  type: QuestionType;

  @IsEnum(Difficulty)
  difficulty: Difficulty;

  @IsOptional()
  @IsEnum(QuestionStatus)
  status?: QuestionStatus;

  @IsNotEmpty()
  @IsString()
  explanation: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuestionOptionDto)
  options: CreateQuestionOptionDto[];
}
