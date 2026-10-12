import { IsArray, IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SaveAnswerDto {
  @IsNotEmpty()
  @IsString()
  questionId: string;

  @IsArray()
  @IsString({ each: true })
  selectedOptionIds: string[];

  @IsOptional()
  @IsBoolean()
  isMarkedForReview?: boolean;
}
