import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCertificationDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  code: string;

  @IsNotEmpty()
  @IsString()
  slug: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}
