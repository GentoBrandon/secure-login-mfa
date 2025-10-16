import { Controller, Get } from '@nestjs/common';
import { ProductsService } from './products.service';
const { Client } = require('pg');
import { config } from 'dotenv';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async GetProducts() {
    const client = new Client({
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT,
    });

    await client.connect();

    try {
      const result = await client.query('SELECT * FROM products');
      return result.rows;
    } catch (error) {
      throw new Error(`Database query failed: ${error.message}`);
    } finally {
      await client.end();
    }
  }
}
