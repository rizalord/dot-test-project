import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { CategoriesService } from './categories.service';

jest.mock('../../prisma/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

import { PrismaService } from '../../prisma/prisma.service';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let prisma: {
    category: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
      count: jest.Mock;
    };
    productCategory: {
      deleteMany: jest.Mock;
    };
  };

  const userId = 'user-1';
  const now = new Date('2026-01-01T00:00:00.000Z');
  const baseCategory = {
    id: 'cat-1',
    user_id: userId,
    name: 'Electronics',
    slug: 'electronics',
    created_at: now,
    updated_at: now,
  };
  const defaultQuery = { search: undefined, page: 1, limit: 10 };

  beforeEach(async () => {
    prisma = {
      category: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      productCategory: {
        deleteMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
  });

  describe('findAll', () => {
    it('returns paginated list of categories', async () => {
      prisma.category.findMany.mockResolvedValue([baseCategory]);
      prisma.category.count.mockResolvedValue(1);

      const result = await service.findAll(userId, defaultQuery);

      expect(prisma.category.findMany).toHaveBeenCalledWith({
        where: { user_id: userId },
        orderBy: { created_at: 'desc' },
        skip: 0,
        take: 10,
      });
      expect(prisma.category.count).toHaveBeenCalledWith({
        where: { user_id: userId },
      });
      expect(result).toEqual({
        message: 'Categories retrieved successfully',
        data: [
          {
            id: baseCategory.id,
            name: baseCategory.name,
            slug: baseCategory.slug,
            created_at: baseCategory.created_at,
            updated_at: baseCategory.updated_at,
          },
        ],
        meta: { page: 1, limit: 10, total: 1, total_pages: 1 },
      });
    });

    it('searches by name', async () => {
      prisma.category.findMany.mockResolvedValue([baseCategory]);
      prisma.category.count.mockResolvedValue(1);

      await service.findAll(userId, { ...defaultQuery, search: 'Elect' });

      expect(prisma.category.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            user_id: userId,
            OR: [
              { name: { contains: 'Elect', mode: 'insensitive' } },
              { slug: { contains: 'Elect', mode: 'insensitive' } },
            ],
          }),
        }),
      );
    });

    it('returns empty array when no categories', async () => {
      prisma.category.findMany.mockResolvedValue([]);
      prisma.category.count.mockResolvedValue(0);

      const result = await service.findAll(userId, defaultQuery);

      expect(result.data).toEqual([]);
      expect(result.meta?.total).toBe(0);
    });
  });

  describe('count', () => {
    it('returns total count', async () => {
      prisma.category.count.mockResolvedValue(5);

      const result = await service.count(userId);

      expect(prisma.category.count).toHaveBeenCalledWith({
        where: { user_id: userId },
      });
      expect(result).toEqual({
        message: 'Category count retrieved successfully',
        data: { total: 5 },
      });
    });
  });

  describe('findOne', () => {
    it('returns category when found', async () => {
      prisma.category.findFirst.mockResolvedValue(baseCategory);

      const result = await service.findOne(userId, 'cat-1');

      expect(prisma.category.findFirst).toHaveBeenCalledWith({
        where: { id: 'cat-1', user_id: userId },
      });
      expect(result).toEqual({
        message: 'Category retrieved successfully',
        data: {
          id: baseCategory.id,
          name: baseCategory.name,
          slug: baseCategory.slug,
          created_at: baseCategory.created_at,
          updated_at: baseCategory.updated_at,
        },
      });
    });

    it('throws NotFoundException when not found', async () => {
      prisma.category.findFirst.mockResolvedValue(null);

      await expect(
        service.findOne(userId, 'nonexistent'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('create', () => {
    it('creates and returns category', async () => {
      prisma.category.findFirst.mockResolvedValue(null);
      prisma.category.create.mockResolvedValue(baseCategory);

      const result = await service.create(userId, { name: 'Electronics' });

      expect(prisma.category.create).toHaveBeenCalledWith({
        data: { user_id: userId, name: 'Electronics', slug: 'electronics' },
      });
      expect(result.message).toBe('Category created successfully');
    });

    it('throws ConflictException when slug already exists', async () => {
      prisma.category.findFirst.mockResolvedValue(baseCategory);

      await expect(
        service.create(userId, { name: 'Electronics' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('update', () => {
    it('updates and returns category', async () => {
      prisma.category.findFirst.mockResolvedValueOnce(baseCategory);
      prisma.category.findFirst.mockResolvedValueOnce(null);
      prisma.category.update.mockResolvedValue({
        ...baseCategory,
        name: 'Updated',
        slug: 'updated',
      });

      const result = await service.update(userId, 'cat-1', {
        name: 'Updated',
      });

      expect(prisma.category.update).toHaveBeenCalledWith({
        where: { id: 'cat-1' },
        data: { name: 'Updated', slug: 'updated' },
      });
      expect(result.message).toBe('Category updated successfully');
    });

    it('throws NotFoundException when category not found', async () => {
      prisma.category.findFirst.mockResolvedValue(null);

      await expect(
        service.update(userId, 'nonexistent', { name: 'Updated' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws ConflictException when new name conflicts', async () => {
      prisma.category.findFirst.mockResolvedValueOnce(baseCategory);
      prisma.category.findFirst.mockResolvedValueOnce({
        id: 'cat-2',
        name: 'Updated',
        slug: 'updated',
        user_id: userId,
        created_at: now,
        updated_at: now,
      });

      await expect(
        service.update(userId, 'cat-1', { name: 'Updated' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('remove', () => {
    it('deletes and returns success', async () => {
      prisma.category.findFirst.mockResolvedValue(baseCategory);
      prisma.productCategory.deleteMany.mockResolvedValue(undefined);
      prisma.category.delete.mockResolvedValue(baseCategory);

      const result = await service.remove(userId, 'cat-1');

      expect(prisma.productCategory.deleteMany).toHaveBeenCalledWith({
        where: { category_id: 'cat-1' },
      });
      expect(prisma.category.delete).toHaveBeenCalledWith({
        where: { id: 'cat-1' },
      });
      expect(result.message).toBe('Category deleted successfully');
      expect(result.data).toBeNull();
    });

    it('throws NotFoundException when not found', async () => {
      prisma.category.findFirst.mockResolvedValue(null);

      await expect(
        service.remove(userId, 'nonexistent'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
