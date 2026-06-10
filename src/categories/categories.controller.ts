import { Controller, Get, Post, Param, Render, Redirect, Body } from '@nestjs/common';

interface Category {
  id: number;
  name: string;
  slug: string;
}

const categories: Category[] = [
  { id: 1, name: 'Electronics', slug: 'electronics' },
  { id: 2, name: 'Clothing', slug: 'clothing' },
];

let nextId = 3;

@Controller('/categories')
export class CategoriesController {
  @Get()
  @Render('categories/index')
  index(@Param() params: any) {
    const search = '';
    return {
      user: { name: 'Admin', initials: 'A' },
      categories,
      search,
    };
  }

  @Get('/create')
  @Render('categories/form')
  create() {
    return { user: { name: 'Admin', initials: 'A' } };
  }

  @Post('/store')
  @Redirect('/categories')
  store(@Body() body: any) {
    const name = body.name;
    const slug = name.toLowerCase().replace(/\s+/g, '-');
    categories.push({ id: nextId++, name, slug });
    return { url: '/categories' };
  }

  @Get('/:id/edit')
  @Render('categories/form')
  edit(@Param('id') id: string) {
    const category = categories.find(c => c.id === Number(id));
    return { user: { name: 'Admin', initials: 'A' }, category };
  }

  @Post('/:id/update')
  @Redirect('/categories')
  update(@Param('id') id: string, @Body() body: any) {
    const category = categories.find(c => c.id === Number(id));
    if (category) {
      category.name = body.name;
      category.slug = body.name.toLowerCase().replace(/\s+/g, '-');
    }
    return { url: '/categories' };
  }

  @Post('/:id/delete')
  @Redirect('/categories')
  delete(@Param('id') id: string) {
    const idx = categories.findIndex(c => c.id === Number(id));
    if (idx !== -1) categories.splice(idx, 1);
    return { url: '/categories' };
  }
}
