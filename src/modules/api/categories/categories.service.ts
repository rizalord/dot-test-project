import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ResponseDto } from '../../../common/dto/response.dto';
import type { PaginationMeta } from '../../../common/dto/response.dto';
import type { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import type { CategoryResource } from './types/category.types';

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

function toResource(
  cat: Prisma.CategoryGetPayload<Record<string, never>>,
): CategoryResource {
  return {
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    created_at: cat.created_at,
    updated_at: cat.updated_at,
  };
}

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    userId: string,
    query: PaginationQueryDto,
  ): Promise<ResponseDto<CategoryResource[]>> {
    const { search, page = 1, limit = 10 } = query;

    const where: Prisma.CategoryWhereInput = {
      user_id: userId,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { slug: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [categories, total] = await Promise.all([
      this.prisma.category.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.category.count({ where }),
    ]);

    const meta: PaginationMeta = {
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
    };

    return {
      message: 'Categories retrieved successfully',
      data: categories.map(toResource),
      meta,
    };
  }

  private async findCategoryOrThrow(userId: string, id: string) {
    let category: Prisma.CategoryGetPayload<Record<string, never>> | null;

    try {
      category = await this.prisma.category.findFirst({
        where: { id, user_id: userId },
      });
    } catch {
      throw new NotFoundException('Category not found');
    }

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async findOne(
    userId: string,
    id: string,
  ): Promise<ResponseDto<CategoryResource>> {
    const category = await this.findCategoryOrThrow(userId, id);

    return {
      message: 'Category retrieved successfully',
      data: toResource(category),
    };
  }

  async create(
    userId: string,
    dto: CreateCategoryDto,
  ): Promise<ResponseDto<CategoryResource>> {
    const slug = toSlug(dto.name);

    const existing = await this.prisma.category.findFirst({
      where: { user_id: userId, slug },
    });

    if (existing) {
      throw new ConflictException('Category name already exists');
    }

    const category = await this.prisma.category.create({
      data: {
        user_id: userId,
        name: dto.name,
        slug,
      },
    });

    return {
      message: 'Category created successfully',
      data: toResource(category),
    };
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateCategoryDto,
  ): Promise<ResponseDto<CategoryResource>> {
    await this.findCategoryOrThrow(userId, id);

    const slug = toSlug(dto.name);

    const duplicate = await this.prisma.category.findFirst({
      where: { user_id: userId, slug, id: { not: id } },
    });

    if (duplicate) {
      throw new ConflictException('Category name already exists');
    }

    const category = await this.prisma.category.update({
      where: { id },
      data: { name: dto.name, slug },
    });

    return {
      message: 'Category updated successfully',
      data: toResource(category),
    };
  }

  async remove(userId: string, id: string): Promise<ResponseDto<null>> {
    await this.findCategoryOrThrow(userId, id);

    await this.prisma.category.delete({ where: { id } });

    return {
      message: 'Category deleted successfully',
      data: null,
    };
  }
}
