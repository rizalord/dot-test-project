import { Controller, Get, Param, Post, Render } from '@nestjs/common';

@Controller('/categories')
export class CategoriesController {
  @Get()
  @Render('pages/categories/index')
  index() {
    return { title: 'Categories' };
  }

  @Get('/create')
  @Render('pages/categories/form')
  create() {
    return { title: 'Create Category' };
  }

  @Get('/:id/edit')
  @Render('pages/categories/form')
  edit(@Param('id') id: string) {
    return { title: 'Edit Category', isEdit: true, categoryId: id };
  }

  @Get('/:id')
  @Render('pages/categories/index')
  show() {
    return { title: 'Categories' };
  }
}
