import { IsNotEmpty, IsString } from 'class-validator';

export class StartAttemptDto {
  @IsNotEmpty()
  @IsString()
  examId: string;
}
