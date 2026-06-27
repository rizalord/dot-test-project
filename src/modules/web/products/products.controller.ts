import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Req,
  Res,
  Render,
  UseGuards,
  Query,
} from '@nestjs/common'
import { JwtCookieGuard } from '../../web/auth/strategy/jwt-cookie.guard'
import { ProductsService } from '../../api/products/products.service'
import { CategoriesService } from '../../api/categories/categories.service'
import { CreateProductDto } from '../../api/products/dto/create-product.dto'
import { UpdateProductDto } from '../../api/products/dto/update-product.dto'
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto'
import { Request, Response } from 'express'

@Controller('products')
@UseGuards(JwtCookieGuard)
export class WebProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly categoriesService: CategoriesService,
  ) {}

  @Get()
  @Render('products/index')
  async index(@Req() req: Request, @Query() query: PaginationQueryDto) {
    const user = (req as any).user
    const result = await this.productsService.findAll(user.sub, query)

    return {
      title: 'Products - Product Management System',
      user: { ...user, initial: user.name.charAt(0).toUpperCase() },
      products: result.data,
      meta: result.meta,
      search: query.search || '',
    }
  }

  @Get('create')
  @Render('products/form')
  async createForm(@Req() req: Request) {
    const user = (req as any).user
    const categoriesResult = await this.categoriesService.findAll(user.sub, {
      page: 1,
      limit: 999,
    } as PaginationQueryDto)

    return {
      title: 'Create Product - Product Management System',
      user: { ...user, initial: user.name.charAt(0).toUpperCase() },
      isEdit: false,
      product: null,
      categories: categoriesResult.data,
      selectedCategoryIds: [],
      error: null,
    }
  }

  @Post('create')
  async create(
    @Req() req: Request,
    @Body() body: any,
    @Res() res: Response,
  ) {
    const user = (req as any).user

    try {
      if (!body.name || !body.name.trim()) {
        throw new Error('Name is required')
      }
      const price = parseFloat(body.price)
      if (isNaN(price) || price < 0) {
        throw new Error('Valid price is required')
      }

      const dto = new CreateProductDto()
      dto.name = body.name.trim()
      dto.price = price
      dto.category_ids = body.category_ids
        ? Array.isArray(body.category_ids)
          ? body.category_ids
          : [body.category_ids]
        : undefined

      await this.productsService.create(user.sub, dto)
      return res.redirect('/products')
    } catch (error) {
      const categoriesResult = await this.categoriesService.findAll(user.sub, {
        page: 1,
        limit: 999,
      } as PaginationQueryDto)

      return res.render('products/form', {
        title: 'Create Product - Product Management System',
        user: { ...user, initial: user.name.charAt(0).toUpperCase() },
        isEdit: false,
        product: body.name ? { name: body.name, price: parseFloat(body.price) || 0 } : null,
        categories: categoriesResult.data,
        selectedCategoryIds: body.category_ids
          ? Array.isArray(body.category_ids)
            ? body.category_ids
            : [body.category_ids]
          : [],
        error: error instanceof Error ? error.message : 'Create failed',
      })
    }
  }

  @Get(':id/edit')
  async editForm(
    @Req() req: Request,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const user = (req as any).user

    try {
      const [productResult, categoriesResult] = await Promise.all([
        this.productsService.findOne(user.sub, id),
        this.categoriesService.findAll(user.sub, {
          page: 1,
          limit: 999,
        } as PaginationQueryDto),
      ])

      const product = productResult.data
      return res.render('products/form', {
        title: 'Edit Product - Product Management System',
        user: { ...user, initial: user.name.charAt(0).toUpperCase() },
        isEdit: true,
        product,
        categories: categoriesResult.data,
        selectedCategoryIds: product.categories.map((c) => c.id),
        error: null,
      })
    } catch {
      return res.redirect('/products')
    }
  }

  @Post(':id/edit')
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: any,
    @Res() res: Response,
  ) {
    const user = (req as any).user

    try {
      if (!body.name || !body.name.trim()) {
        throw new Error('Name is required')
      }
      const price = parseFloat(body.price)
      if (isNaN(price) || price < 0) {
        throw new Error('Valid price is required')
      }

      const dto = new UpdateProductDto()
      dto.name = body.name.trim()
      dto.price = price
      dto.category_ids = body.category_ids
        ? Array.isArray(body.category_ids)
          ? body.category_ids
          : [body.category_ids]
        : undefined

      await this.productsService.update(user.sub, id, dto)
      return res.redirect('/products')
    } catch (error) {
      const categoriesResult = await this.categoriesService.findAll(user.sub, {
        page: 1,
        limit: 999,
      } as PaginationQueryDto)

      return res.render('products/form', {
        title: 'Edit Product - Product Management System',
        user: { ...user, initial: user.name.charAt(0).toUpperCase() },
        isEdit: true,
        product: { id, name: body.name, price: parseFloat(body.price) || 0 },
        categories: categoriesResult.data,
        selectedCategoryIds: body.category_ids
          ? Array.isArray(body.category_ids)
            ? body.category_ids
            : [body.category_ids]
          : [],
        error: error instanceof Error ? error.message : 'Update failed',
      })
    }
  }

  @Post(':id/delete')
  async remove(
    @Req() req: Request,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const user = (req as any).user
    try {
      await this.productsService.remove(user.sub, id)
    } catch {
      // ignore
    }
    return res.redirect('/products')
  }
}
