import { IsEnum, IsOptional, IsString } from 'class-validator';
import { QuestionType, Difficulty, QuestionStatus } from '@prisma/client';

export class QueryQuestionsDto {
  @IsOptional()
  @IsString()
  certificationId?: string;

  @IsOptional()
  @IsString()
  domainId?: string;

  @IsOptional()
  @IsEnum(QuestionType)
  type?: QuestionType;

  @IsOptional()
  @IsEnum(Difficulty)
  difficulty?: Difficulty;

  @IsOptional()
  @IsEnum(QuestionStatus)
  status?: QuestionStatus;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  limit?: string;
}
