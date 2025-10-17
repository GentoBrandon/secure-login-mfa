import { Controller, Get, Post, Body } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HttpException, HttpStatus } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductDto } from './dto/get-products.dto';
// import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('products')
// @UseGuards(JwtAuthGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) { }

  @Get('get-all-products')
  @ApiOperation({ summary: 'Get all products' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The list of products successfully retrieved',
    type: [ProductDto]
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error occurred while fetching products'
  })
  async getAllProducts() : Promise<{ status: HttpStatus, data: ProductDto[] }> {
    try {
      const { status, data } = await this.productsService.getProducts();
      if (status !== HttpStatus.OK) {
        throw new HttpException(data, status);
      }
      return {
        status,
        data
      };
    } catch (error) {
      throw new HttpException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message || 'Error getting products'
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('create-product')
  @ApiOperation({ summary: 'Create a product' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The product has been successfully created',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid product data provided'
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error occurred while creating product'
  })
  async createProduct(@Body() createProductDto: CreateProductDto) {
    try {
      const { status, data } = await this.productsService.createProduct(createProductDto);
      return {
        success: HttpStatus.CREATED,
        message: 'Product created successfully',
        data
      };
    } catch (error) {
      throw new HttpException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message || 'Error creating product'
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
