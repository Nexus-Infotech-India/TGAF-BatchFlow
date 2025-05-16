import { Request, Response } from 'express';
import { PrismaClient } from '../../generated/prisma';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

export class ProductController {
  // Create a new product
  async createProduct(req: Request, res: Response): Promise<void> {
    try {
      const { name, code } = req.body;

      if (!name) {
        res.status(400).json({ message: 'Product name is required' });
        return;
      }

      // Check if a product with the same name or code already exists
      const existingProduct = await prisma.product.findFirst({
        where: {
          OR: [
            { name },
            { code }
          ]
        }
      });

      if (existingProduct) {
        res.status(400).json({ message: 'Product with the same name or code already exists' });
        return;
      }

      // Create the product
      const product = await prisma.product.create({
        data: {
          id: uuidv4(),
          name,
          code,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      res.status(201).json({
        message: 'Product created successfully',
        product
      });
    } catch (error) {
      console.error('Create product error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  async getProducts(req: Request, res: Response): Promise<void> {
    try {
      const { name, code, page = 1, limit = 10 } = req.query;

      // Build filtering conditions
      const whereConditions: any = {};
      if (name) {
        whereConditions.name = { contains: name as string, mode: 'insensitive' };
      }
      if (code) {
        whereConditions.code = { contains: code as string, mode: 'insensitive' };
      }

      // Pagination
      const skip = (Number(page) - 1) * Number(limit);
      const take = Number(limit);

      // Fetch products
      const products = await prisma.product.findMany({
        where: whereConditions,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      });

      // Get total count for pagination
      const totalCount = await prisma.product.count({
        where: whereConditions,
      });

      res.status(200).json({
        message: 'Products fetched successfully',
        products,
        pagination: {
          totalCount,
          totalPages: Math.ceil(totalCount / Number(limit)),
          currentPage: Number(page),
          limit: Number(limit),
        },
      });
    } catch (error) {
      console.error('Get products error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
}

export default new ProductController();