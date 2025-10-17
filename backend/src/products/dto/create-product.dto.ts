import { IsString, IsNotEmpty, IsNumber, MaxLength, MinLength, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({ example: 'Product Name', description: 'Product name' })
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Product Description', description: 'Product description' })
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 99.99, description: 'Product price' })
  @IsNumber()
  @Min(0)
  @Max(1000000)
  @IsNotEmpty()
  price: number;

  @ApiProperty({ example: 100, description: 'Product stock' })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsNotEmpty()
  stock: number;
}