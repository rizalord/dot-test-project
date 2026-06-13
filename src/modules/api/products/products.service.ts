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
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import type { ProductResource } from './types/product.types';

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

function toResource(
  product: Prisma.ProductGetPayload<{
    include: { categories: { include: { category: true } } };
  }>,
): ProductResource {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    price: Number(product.price),
    categories: product.categories.map((pc) => ({
      id: pc.category.id,
      name: pc.category.name,
      slug: pc.category.slug,
    })),
    created_at: product.created_at,
    updated_at: product.updated_at,
  };
}

const productInclude = {
  categories: { include: { category: true } },
} satisfies Prisma.ProductInclude;

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    userId: string,
    query: PaginationQueryDto,
  ): Promise<ResponseDto<ProductResource[]>> {
    const { search, page = 1, limit = 10 } = query;

    const where: Prisma.ProductWhereInput = {
      user_id: userId,
      ...(search
        ? {
            OR: [{ name: { contains: search, mode: 'insensitive' } }],
          }
        : {}),
    };

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: productInclude,
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.product.count({ where }),
    ]);

    const meta: PaginationMeta = {
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
    };

    return {
      message: 'Products retrieved successfully',
      data: products.map(toResource),
      meta,
    };
  }

  private async findProductOrThrow(userId: string, id: string) {
    let product: Prisma.ProductGetPayload<{
      include: typeof productInclude;
    }> | null;

    try {
      product = await this.prisma.product.findFirst({
        where: { id, user_id: userId },
        include: productInclude,
      });
    } catch {
      throw new NotFoundException('Product not found');
    }

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async findOne(
    userId: string,
    id: string,
  ): Promise<ResponseDto<ProductResource>> {
    const product = await this.findProductOrThrow(userId, id);

    return {
      message: 'Product retrieved successfully',
      data: toResource(product),
    };
  }

  async create(
    userId: string,
    dto: CreateProductDto,
  ): Promise<ResponseDto<ProductResource>> {
    const slug = toSlug(dto.name);

    const existing = await this.prisma.product.findUnique({
      where: { user_id_slug: { user_id: userId, slug } },
    });

    if (existing) {
      throw new ConflictException('Product name already exists');
    }

    const product = await this.prisma.product.create({
      data: {
        user_id: userId,
        name: dto.name,
        slug,
        price: dto.price,
        categories: dto.category_ids?.length
          ? {
              create: dto.category_ids.map((category_id) => ({
                category_id,
              })),
            }
          : undefined,
      },
      include: productInclude,
    });

    return {
      message: 'Product created successfully',
      data: toResource(product),
    };
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateProductDto,
  ): Promise<ResponseDto<ProductResource>> {
    await this.findProductOrThrow(userId, id);

    const slug = toSlug(dto.name);

    const duplicate = await this.prisma.product.findFirst({
      where: { user_id: userId, slug, id: { not: id } },
    });

    if (duplicate) {
      throw new ConflictException('Product name already exists');
    }

    // Replace category connections
    if (dto.category_ids) {
      await this.prisma.productCategory.deleteMany({
        where: { product_id: id },
      });

      if (dto.category_ids.length > 0) {
        await this.prisma.productCategory.createMany({
          data: dto.category_ids.map((category_id) => ({
            product_id: id,
            category_id,
          })),
        });
      }
    }

    const product = await this.prisma.product.update({
      where: { id },
      data: { name: dto.name, slug, price: dto.price },
      include: productInclude,
    });

    return {
      message: 'Product updated successfully',
      data: toResource(product),
    };
  }

  async remove(userId: string, id: string): Promise<ResponseDto<null>> {
    await this.findProductOrThrow(userId, id);

    await this.prisma.productCategory.deleteMany({
      where: { product_id: id },
    });

    await this.prisma.product.delete({ where: { id } });

    return {
      message: 'Product deleted successfully',
      data: null,
    };
  }
}
