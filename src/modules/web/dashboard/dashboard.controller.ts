import { Controller, Get, Render, Req, UseGuards } from '@nestjs/common'
import { JwtCookieGuard } from '../auth/strategy/jwt-cookie.guard'
import { ProductsService } from '../../api/products/products.service'
import { CategoriesService } from '../../api/categories/categories.service'
import { Request } from 'express'

@Controller()
@UseGuards(JwtCookieGuard)
export class DashboardController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly categoriesService: CategoriesService,
  ) {}

  @Get()
  @Render('index')
  async index(@Req() req: Request) {
    const user = (req as any).user

    const [productCount, categoryCount] = await Promise.all([
      this.productsService.count(user.sub),
      this.categoriesService.count(user.sub),
    ])

    return {
      title: 'Dashboard - Product Management System',
      message: 'Welcome back, ' + user.name + '!',
      year: new Date().getFullYear(),
      user: { ...user, initial: user.name.charAt(0).toUpperCase() },
      productCount: productCount.data.total,
      categoryCount: categoryCount.data.total,
    }
  }
}
