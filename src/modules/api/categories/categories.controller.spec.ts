import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';

jest.mock('../../prisma/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

import { PrismaService } from '../../prisma/prisma.service';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

describe('CategoriesController', () => {
  let controller: CategoriesController;
  let categoriesService: CategoriesService;

  const now = new Date('2026-01-01T00:00:00.000Z');
  const user = { id: 'user-1', email: 'jane@example.com', name: 'Jane' };
  const baseCategory = {
    id: 'cat-1',
    name: 'Electronics',
    slug: 'electronics',
    created_at: now,
    updated_at: now,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoriesController],
      providers: [
        CategoriesService,
        {
          provide: PrismaService,
          useValue: {
            category: {
              findMany: jest.fn(),
              findFirst: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
              count: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    controller = module.get<CategoriesController>(CategoriesController);
    categoriesService = module.get<CategoriesService>(CategoriesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('calls service.findAll with user id and query', async () => {
      const query: PaginationQueryDto = { page: 1, limit: 10 };
      const expected = {
        message: 'Categories retrieved successfully',
        data: [baseCategory],
        meta: { page: 1, limit: 10, total: 1, total_pages: 1 },
      };
      jest.spyOn(categoriesService, 'findAll').mockResolvedValue(expected);

      const result = await controller.findAll(user, query);

      expect(result).toEqual(expected);
      expect(categoriesService.findAll).toHaveBeenCalledWith('user-1', query);
    });
  });

  describe('findOne', () => {
    it('calls service.findOne with user id and param', async () => {
      const expected = {
        message: 'Category retrieved successfully',
        data: baseCategory,
      };
      jest.spyOn(categoriesService, 'findOne').mockResolvedValue(expected);

      const result = await controller.findOne(user, 'cat-1');

      expect(result).toEqual(expected);
      expect(categoriesService.findOne).toHaveBeenCalledWith('user-1', 'cat-1');
    });
  });

  describe('create', () => {
    it('calls service.create with user id and dto', async () => {
      const dto = { name: 'Electronics' };
      const expected = {
        message: 'Category created successfully',
        data: baseCategory,
      };
      jest.spyOn(categoriesService, 'create').mockResolvedValue(expected);

      const result = await controller.create(user, dto);

      expect(result).toEqual(expected);
      expect(categoriesService.create).toHaveBeenCalledWith('user-1', dto);
    });
  });

  describe('update', () => {
    it('calls service.update with user id, param, and dto', async () => {
      const dto = { name: 'Updated' };
      const expected = {
        message: 'Category updated successfully',
        data: { ...baseCategory, name: 'Updated', slug: 'updated' },
      };
      jest.spyOn(categoriesService, 'update').mockResolvedValue(expected);

      const result = await controller.update(user, 'cat-1', dto);

      expect(result).toEqual(expected);
      expect(categoriesService.update).toHaveBeenCalledWith(
        'user-1',
        'cat-1',
        dto,
      );
    });
  });

  describe('remove', () => {
    it('calls service.remove with user id and param', async () => {
      const expected = { message: 'Category deleted successfully', data: null };
      jest.spyOn(categoriesService, 'remove').mockResolvedValue(expected);

      const result = await controller.remove(user, 'cat-1');

      expect(result).toEqual(expected);
      expect(categoriesService.remove).toHaveBeenCalledWith('user-1', 'cat-1');
    });
  });
});
