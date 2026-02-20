import { IsString, IsArray, IsNotEmpty } from 'class-validator';

export class CreateOrderDto {
  @IsString()
  @IsNotEmpty()
  customerName: string;

  @IsArray()
  items: { productId: string; quantity: number }[];
}
