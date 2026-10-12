import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateDomainDto {
  @IsNotEmpty()
  @IsString()
  certificationId: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  weight?: number;
}
