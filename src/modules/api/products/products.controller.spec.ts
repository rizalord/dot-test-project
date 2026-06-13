import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

jest.mock('../../prisma/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

import { PrismaService } from '../../prisma/prisma.service';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

describe('ProductsController', () => {
  let controller: ProductsController;
  let productsService: ProductsService;

  const now = new Date('2026-01-01T00:00:00.000Z');
  const user = { id: 'user-1', email: 'jane@example.com', name: 'Jane' };
  const baseProduct = {
    id: 'prod-1',
    name: 'Smartphone',
    slug: 'smartphone',
    price: 5000000,
    categories: [{ id: 'cat-1', name: 'Electronics', slug: 'electronics' }],
    created_at: now,
    updated_at: now,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        ProductsService,
        {
          provide: PrismaService,
          useValue: {
            product: {
              findMany: jest.fn(),
              findFirst: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
              count: jest.fn(),
            },
            productCategory: {
              deleteMany: jest.fn(),
              createMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    controller = module.get<ProductsController>(ProductsController);
    productsService = module.get<ProductsService>(ProductsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('calls service.findAll with user id and query', async () => {
      const query: PaginationQueryDto = { page: 1, limit: 10 };
      const expected = {
        message: 'Products retrieved successfully',
        data: [baseProduct],
        meta: { page: 1, limit: 10, total: 1, total_pages: 1 },
      };
      jest.spyOn(productsService, 'findAll').mockResolvedValue(expected);

      const result = await controller.findAll(user, query);

      expect(result).toEqual(expected);
      expect(productsService.findAll).toHaveBeenCalledWith('user-1', query);
    });
  });

  describe('findOne', () => {
    it('calls service.findOne with user id and param', async () => {
      const expected = {
        message: 'Product retrieved successfully',
        data: baseProduct,
      };
      jest.spyOn(productsService, 'findOne').mockResolvedValue(expected);

      const result = await controller.findOne(user, 'prod-1');

      expect(result).toEqual(expected);
      expect(productsService.findOne).toHaveBeenCalledWith('user-1', 'prod-1');
    });
  });

  describe('create', () => {
    it('calls service.create with user id and dto', async () => {
      const dto = { name: 'Smartphone', price: 5000000 };
      const expected = {
        message: 'Product created successfully',
        data: baseProduct,
      };
      jest.spyOn(productsService, 'create').mockResolvedValue(expected);

      const result = await controller.create(user, dto);

      expect(result).toEqual(expected);
      expect(productsService.create).toHaveBeenCalledWith('user-1', dto);
    });
  });

  describe('update', () => {
    it('calls service.update with user id, param, and dto', async () => {
      const dto = { name: 'Updated', price: 6000000 };
      const expected = {
        message: 'Product updated successfully',
        data: { ...baseProduct, name: 'Updated', slug: 'updated' },
      };
      jest.spyOn(productsService, 'update').mockResolvedValue(expected);

      const result = await controller.update(user, 'prod-1', dto);

      expect(result).toEqual(expected);
      expect(productsService.update).toHaveBeenCalledWith(
        'user-1',
        'prod-1',
        dto,
      );
    });
  });

  describe('remove', () => {
    it('calls service.remove with user id and param', async () => {
      const expected = { message: 'Product deleted successfully', data: null };
      jest.spyOn(productsService, 'remove').mockResolvedValue(expected);

      const result = await controller.remove(user, 'prod-1');

      expect(result).toEqual(expected);
      expect(productsService.remove).toHaveBeenCalledWith('user-1', 'prod-1');
    });
  });
});
