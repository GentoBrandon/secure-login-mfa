import { IsDate, IsString , IsNotEmpty, IsNumber} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ProductDto {
  @ApiProperty({ example: 200, description: 'HTTP Status code' })
  @IsNumber()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Product Description', description: 'Product description' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 99.99, description: 'Product price' })
  @IsNumber()
  @IsNotEmpty()
  price: number;

  @ApiProperty({ example: 100, description: 'Product stock' })
  @IsNumber()
  @IsNotEmpty()
  stock: number;

  @ApiProperty({ example: new Date(), description: 'Product created at' })
  @IsDate()
  @IsNotEmpty()
  createdAt: Date;

  @ApiProperty({ example: new Date(), description: 'Product updated at' })
  @IsDate()
  @IsNotEmpty()
  updatedAt: Date;
}