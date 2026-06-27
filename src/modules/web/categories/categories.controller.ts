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
import { CategoriesService } from '../../api/categories/categories.service'
import { CreateCategoryDto } from '../../api/categories/dto/create-category.dto'
import { UpdateCategoryDto } from '../../api/categories/dto/update-category.dto'
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto'
import { Request, Response } from 'express'

@Controller('categories')
@UseGuards(JwtCookieGuard)
export class WebCategoriesController {
  constructor(
    private readonly categoriesService: CategoriesService,
  ) {}

  @Get()
  @Render('categories/index')
  async index(@Req() req: Request, @Query() query: PaginationQueryDto) {
    const user = (req as any).user
    const result = await this.categoriesService.findAll(user.sub, query)

    return {
      title: 'Categories - Product Management System',
      user: { ...user, initial: user.name.charAt(0).toUpperCase() },
      categories: result.data,
      meta: result.meta,
      search: query.search || '',
    }
  }

  @Get('create')
  @Render('categories/form')
  async createForm(@Req() req: Request) {
    const user = (req as any).user
    return {
      title: 'Create Category - Product Management System',
      user: { ...user, initial: user.name.charAt(0).toUpperCase() },
      isEdit: false,
      category: null,
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

      const dto = new CreateCategoryDto()
      dto.name = body.name.trim()

      await this.categoriesService.create(user.sub, dto)
      return res.redirect('/categories')
    } catch (error) {
      return res.render('categories/form', {
        title: 'Create Category - Product Management System',
        user: { ...user, initial: user.name.charAt(0).toUpperCase() },
        isEdit: false,
        category: null,
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
      const result = await this.categoriesService.findOne(user.sub, id)
      return res.render('categories/form', {
        title: 'Edit Category - Product Management System',
        user: { ...user, initial: user.name.charAt(0).toUpperCase() },
        isEdit: true,
        category: result.data,
        error: null,
      })
    } catch {
      return res.redirect('/categories')
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

      const dto = new UpdateCategoryDto()
      dto.name = body.name.trim()

      await this.categoriesService.update(user.sub, id, dto)
      return res.redirect('/categories')
    } catch (error) {
      return res.render('categories/form', {
        title: 'Edit Category - Product Management System',
        user: { ...user, initial: user.name.charAt(0).toUpperCase() },
        isEdit: true,
        category: { id, name: body.name },
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
      await this.categoriesService.remove(user.sub, id)
    } catch {
      // ignore
    }
    return res.redirect('/categories')
  }
}
