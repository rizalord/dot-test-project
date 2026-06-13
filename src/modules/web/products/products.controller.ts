import { Controller, Get, Param, Render } from '@nestjs/common';

@Controller('/products')
export class ProductsController {
  @Get()
  @Render('pages/products/index')
  index() {
    return { title: 'Products' };
  }

  @Get('/create')
  @Render('pages/products/form')
  create() {
    return { title: 'Create Product', isEdit: false };
  }

  @Get('/:id')
  @Render('pages/products/show')
  show(@Param('id') id: string) {
    return { title: 'Product', id };
  }

  @Get('/:id/edit')
  @Render('pages/products/form')
  edit(@Param('id') id: string) {
    return { title: 'Edit Product', isEdit: true, id };
  }
}
