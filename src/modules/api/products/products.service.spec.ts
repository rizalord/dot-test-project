import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { ProductsService } from './products.service';

jest.mock('../../prisma/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

import { PrismaService } from '../../prisma/prisma.service';

describe('ProductsService', () => {
  let service: ProductsService;
  let prisma: {
    product: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    productCategory: {
      deleteMany: jest.Mock;
      createMany: jest.Mock;
    };
  };

  const userId = 'user-1';
  const now = new Date('2026-01-01T00:00:00.000Z');
  const baseProduct = {
    id: 'prod-1',
    user_id: userId,
    name: 'Smartphone',
    slug: 'smartphone',
    price: 5000000n,
    created_at: now,
    updated_at: now,
    categories: [
      {
        product_id: 'prod-1',
        category_id: 'cat-1',
        category: {
          id: 'cat-1',
          name: 'Electronics',
          slug: 'electronics',
          created_at: now,
          updated_at: now,
        },
      },
    ],
  };

  beforeEach(async () => {
    prisma = {
      product: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      productCategory: {
        deleteMany: jest.fn(),
        createMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  describe('findAll', () => {
    it('returns list of products', async () => {
      prisma.product.findMany.mockResolvedValue([baseProduct]);

      const result = await service.findAll(userId);

      expect(prisma.product.findMany).toHaveBeenCalledWith({
        where: { user_id: userId },
        include: { categories: { include: { category: true } } },
        orderBy: { created_at: 'desc' },
      });
      expect(result.message).toBe('Products retrieved successfully');
      expect(result.data).toHaveLength(1);
      expect(result.data[0].categories).toHaveLength(1);
      expect(result.data[0].categories[0].name).toBe('Electronics');
    });

    it('returns empty array when no products', async () => {
      prisma.product.findMany.mockResolvedValue([]);

      const result = await service.findAll(userId);

      expect(result.data).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('returns product when found', async () => {
      prisma.product.findFirst.mockResolvedValue(baseProduct);

      const result = await service.findOne(userId, 'prod-1');

      expect(result.message).toBe('Product retrieved successfully');
      expect(result.data.price).toBe(5000000);
    });

    it('throws NotFoundException when not found', async () => {
      prisma.product.findFirst.mockResolvedValue(null);

      await expect(
        service.findOne(userId, 'nonexistent'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('create', () => {
    it('creates and returns product without categories', async () => {
      prisma.product.findUnique.mockResolvedValue(null);
      prisma.product.create.mockResolvedValue({
        ...baseProduct,
        categories: [],
      });

      const result = await service.create(userId, {
        name: 'Smartphone',
        price: 5000000,
      });

      expect(prisma.product.create).toHaveBeenCalledWith({
        data: {
          user_id: userId,
          name: 'Smartphone',
          slug: 'smartphone',
          price: 5000000,
          categories: undefined,
        },
        include: { categories: { include: { category: true } } },
      });
      expect(result.message).toBe('Product created successfully');
    });

    it('creates with category_ids', async () => {
      prisma.product.findUnique.mockResolvedValue(null);
      prisma.product.create.mockResolvedValue(baseProduct);

      const result = await service.create(userId, {
        name: 'Smartphone',
        price: 5000000,
        category_ids: ['cat-1'],
      });

      expect(prisma.product.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            categories: { create: [{ category_id: 'cat-1' }] },
          }),
        }),
      );
      expect(result.data.categories).toHaveLength(1);
    });

    it('throws ConflictException when slug exists', async () => {
      prisma.product.findUnique.mockResolvedValue(baseProduct);

      await expect(
        service.create(userId, { name: 'Smartphone', price: 5000000 }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('update', () => {
    it('updates and returns product', async () => {
      prisma.product.findFirst.mockResolvedValueOnce(baseProduct);
      prisma.product.findFirst.mockResolvedValueOnce(null);
      prisma.productCategory.deleteMany.mockResolvedValue(undefined);
      prisma.productCategory.createMany.mockResolvedValue(undefined);
      prisma.product.update.mockResolvedValue({
        ...baseProduct,
        name: 'Updated',
        slug: 'updated',
      });

      const result = await service.update(userId, 'prod-1', {
        name: 'Updated',
        price: 6000000,
        category_ids: ['cat-2'],
      });

      expect(prisma.productCategory.deleteMany).toHaveBeenCalledWith({
        where: { product_id: 'prod-1' },
      });
      expect(prisma.productCategory.createMany).toHaveBeenCalledWith({
        data: [{ product_id: 'prod-1', category_id: 'cat-2' }],
      });
      expect(result.message).toBe('Product updated successfully');
    });

    it('throws NotFoundException when not found', async () => {
      prisma.product.findFirst.mockResolvedValue(null);

      await expect(
        service.update(userId, 'nonexistent', {
          name: 'Updated',
          price: 1000,
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('remove', () => {
    it('deletes product and relations', async () => {
      prisma.product.findFirst.mockResolvedValue(baseProduct);
      prisma.productCategory.deleteMany.mockResolvedValue(undefined);
      prisma.product.delete.mockResolvedValue(baseProduct);

      const result = await service.remove(userId, 'prod-1');

      expect(prisma.productCategory.deleteMany).toHaveBeenCalledWith({
        where: { product_id: 'prod-1' },
      });
      expect(prisma.product.delete).toHaveBeenCalledWith({
        where: { id: 'prod-1' },
      });
      expect(result.message).toBe('Product deleted successfully');
    });

    it('throws NotFoundException when not found', async () => {
      prisma.product.findFirst.mockResolvedValue(null);

      await expect(
        service.remove(userId, 'nonexistent'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
