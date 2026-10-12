import { IsNotEmpty, IsString } from 'class-validator';

export class CreatePaymentOrderDto {
  @IsNotEmpty()
  @IsString()
  productId: string;
}
