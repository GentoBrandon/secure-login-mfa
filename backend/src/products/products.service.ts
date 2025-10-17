import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { ProductDto } from './dto/get-products.dto';
import { HttpException, HttpStatus } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';

@Injectable()
export class ProductsService {
    constructor(private readonly prisma: PrismaService) { }
    async getProducts() : Promise<{ status: HttpStatus, data: ProductDto[] }> {
        try {
            const products = await this.prisma.products.findMany();
            return {
                status: HttpStatus.OK,
                data: products as ProductDto[]
            };
        } catch (error) {
            throw new HttpException({
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                error: `Error getting products: ${error.message}`,
            }, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async createProduct(createProductDto: CreateProductDto) : Promise<{ status: HttpStatus, data: ProductDto }> {
        try {
            const product = await this.prisma.products.create({
                data: createProductDto,
            });
            return {
                status: HttpStatus.CREATED,
                data: product as ProductDto,
            };
        } catch (error) {
            throw new HttpException({
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                error: `Error creating product: ${error.message}`,
            }, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}   
