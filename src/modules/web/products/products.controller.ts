import {
  Controller,
  Get,
  Post,
  Param,
  Render,
  Redirect,
  Body,
} from '@nestjs/common';

interface Product {
  id: number;
  name: string;
  slug: string;
  price: number;
  categoryId: number;
}

interface Category {
  id: number;
  name: string;
}

const categories: Category[] = [
  { id: 1, name: 'Electronics' },
  { id: 2, name: 'Clothing' },
];

const products: Product[] = [
  {
    id: 1,
    name: 'Smartphone',
    slug: 'smartphone',
    price: 5000000,
    categoryId: 1,
  },
  { id: 2, name: 'Laptop', slug: 'laptop', price: 15000000, categoryId: 1 },
  { id: 3, name: 'T-Shirt', slug: 't-shirt', price: 150000, categoryId: 2 },
];

let nextId = 4;

@Controller('/products')
export class ProductsController {
  @Get()
  @Render('pages/products/index')
  index() {
    return {
      title: 'Products',
      user: { name: 'Admin', initials: 'A' },
      products,
      categories,
    };
  }

  @Get('/create')
  @Render('pages/products/form')
  create() {
    return {
      title: 'Create Product',
      user: { name: 'Admin', initials: 'A' },
      categories,
    };
  }

  @Post('/store')
  @Redirect('/products')
  store(@Body() body: any) {
    const name = body.name;
    const slug = name.toLowerCase().replace(/\s+/g, '-');
    products.push({
      id: nextId++,
      name,
      slug,
      price: Number(body.price),
      categoryId: Number(body.categoryId),
    });
    return { url: '/products' };
  }

  @Get('/:id')
  @Render('pages/products/show')
  show(@Param('id') id: string) {
    const product = products.find((p) => p.id === Number(id));
    const category = categories.find((c) => c.id === product?.categoryId);
    return {
      title: product?.name ?? 'Product',
      user: { name: 'Admin', initials: 'A' },
      product,
      categoryName: category?.name,
    };
  }

  @Get('/:id/edit')
  @Render('pages/products/form')
  edit(@Param('id') id: string) {
    const product = products.find((p) => p.id === Number(id));
    return {
      title: 'Edit Product',
      user: { name: 'Admin', initials: 'A' },
      product,
      categories,
    };
  }

  @Post('/:id/update')
  @Redirect('/products')
  update(@Param('id') id: string, @Body() body: any) {
    const product = products.find((p) => p.id === Number(id));
    if (product) {
      product.name = body.name;
      product.slug = body.name.toLowerCase().replace(/\s+/g, '-');
      product.price = Number(body.price);
      product.categoryId = Number(body.categoryId);
    }
    return { url: '/products' };
  }

  @Post('/:id/delete')
  @Redirect('/products')
  delete(@Param('id') id: string) {
    const idx = products.findIndex((p) => p.id === Number(id));
    if (idx !== -1) products.splice(idx, 1);
    return { url: '/products' };
  }
}
