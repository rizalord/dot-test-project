import { INestApplication, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/modules/prisma/prisma.service';
import { buildValidationPipe } from '../src/common/pipes/validation.pipe';

describe('Products API (e2e)', () => {
  let app: INestApplication<App>;
  let jwtService: JwtService;
  const now = new Date('2026-01-01T00:00:00.000Z');

  const userId = '44444444-4444-4444-4444-444444444444';
  const categoryId = '55555555-5555-5555-5555-555555555555';
  const productId = '66666666-6666-6666-6666-666666666666';

  const productRecord = {
    id: productId,
    user_id: userId,
    name: 'Smartphone',
    slug: 'smartphone',
    price: 5000000n,
    created_at: now,
    updated_at: now,
    categories: [
      {
        product_id: productId,
        category_id: categoryId,
        category: {
          id: categoryId,
          name: 'Electronics',
          slug: 'electronics',
          created_at: now,
          updated_at: now,
        },
      },
    ],
  };

  const prismaMock = {
    product: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    productCategory: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
      findMany: jest.fn(),
    },
  };

  const configMock: Partial<ConfigService> = {
    get: jest.fn((key: string) => {
      if (key === 'jwt.secret') return 'test-secret';
      if (key === 'jwt.expiresIn') return '1h';
      if (key === 'port') return 3000;
      return undefined;
    }),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .overrideProvider(ConfigService)
      .useValue(configMock)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(buildValidationPipe());

    await app.init();
    jwtService = moduleFixture.get(JwtService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    for (const key of Object.keys(prismaMock)) {
      for (const method of Object.keys(
        prismaMock[key as keyof typeof prismaMock],
      )) {
        (
          prismaMock[key as keyof typeof prismaMock][
            method as keyof (typeof prismaMock)[keyof typeof prismaMock]
          ] as jest.Mock
        ).mockReset();
      }
    }
  });

  function validToken(): string {
    return jwtService.sign({
      sub: userId,
      email: 'jane@example.com',
      name: 'Jane',
    });
  }

  describe('GET /api/v1/products', () => {
    it('returns 401 without bearer token', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/products')
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('returns 200 with paginated products list', async () => {
      prismaMock.product.findMany.mockResolvedValue([productRecord]);
      prismaMock.product.count.mockResolvedValue(1);

      const res = await request(app.getHttpServer())
        .get('/api/v1/products')
        .set('Authorization', `Bearer ${validToken()}`)
        .expect(HttpStatus.OK);

      expect(res.body).toMatchObject({
        message: 'Products retrieved successfully',
        data: [
          {
            id: productId,
            name: 'Smartphone',
            slug: 'smartphone',
            price: 5000000,
          },
        ],
        meta: { page: 1, limit: 10, total: 1, total_pages: 1 },
      });
    });

    it('supports search and pagination query params', async () => {
      prismaMock.product.findMany.mockResolvedValue([]);
      prismaMock.product.count.mockResolvedValue(0);

      await request(app.getHttpServer())
        .get('/api/v1/products?search=Phone&page=2&limit=5')
        .set('Authorization', `Bearer ${validToken()}`)
        .expect(HttpStatus.OK);

      expect(prismaMock.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 5,
          take: 5,
          where: expect.objectContaining({
            OR: [{ name: { contains: 'Phone', mode: 'insensitive' } }],
          }),
        }),
      );
    });
  });

  describe('GET /api/v1/products/:id', () => {
    it('returns 200 with product', async () => {
      prismaMock.product.findFirst.mockResolvedValue(productRecord);

      const res = await request(app.getHttpServer())
        .get(`/api/v1/products/${productId}`)
        .set('Authorization', `Bearer ${validToken()}`)
        .expect(HttpStatus.OK);

      expect(res.body).toMatchObject({
        message: 'Product retrieved successfully',
        data: { id: productId },
      });
    });

    it('returns 404 when not found', async () => {
      prismaMock.product.findFirst.mockResolvedValue(null);

      const res = await request(app.getHttpServer())
        .get('/api/v1/products/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${validToken()}`)
        .expect(HttpStatus.NOT_FOUND);

      expect(res.body.message).toBe('Product not found');
    });
  });

  describe('POST /api/v1/products', () => {
    it('returns 201 with created product', async () => {
      prismaMock.product.findUnique.mockResolvedValue(null);
      prismaMock.product.create.mockResolvedValue(productRecord);

      const res = await request(app.getHttpServer())
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${validToken()}`)
        .send({ name: 'Smartphone', price: 5000000 })
        .expect(HttpStatus.CREATED);

      expect(res.body).toMatchObject({
        message: 'Product created successfully',
        data: { name: 'Smartphone', slug: 'smartphone', price: 5000000 },
      });
    });

    it('returns 400 when name is empty', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${validToken()}`)
        .send({ name: '', price: 5000000 })
        .expect(HttpStatus.BAD_REQUEST);

      expect(res.body.message.length).toBeGreaterThan(0);
      expect(res.body.error).toBe('Bad Request');
    });

    it('returns 400 when price is negative', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${validToken()}`)
        .send({ name: 'Smartphone', price: -100 })
        .expect(HttpStatus.BAD_REQUEST);

      expect(res.body.message.length).toBeGreaterThan(0);
    });

    it('returns 409 when name already exists', async () => {
      prismaMock.product.findUnique.mockResolvedValue(productRecord);

      const res = await request(app.getHttpServer())
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${validToken()}`)
        .send({ name: 'Smartphone', price: 5000000 })
        .expect(HttpStatus.CONFLICT);

      expect(res.body.message).toBe('Product name already exists');
    });
  });

  describe('PUT /api/v1/products/:id', () => {
    it('returns 200 with updated product', async () => {
      prismaMock.product.findFirst.mockResolvedValueOnce(productRecord);
      prismaMock.product.findFirst.mockResolvedValueOnce(null);
      prismaMock.productCategory.deleteMany.mockResolvedValue(undefined);
      prismaMock.product.update.mockResolvedValue({
        ...productRecord,
        name: 'Updated',
        slug: 'updated',
        price: 6000000n,
      });

      const res = await request(app.getHttpServer())
        .put(`/api/v1/products/${productId}`)
        .set('Authorization', `Bearer ${validToken()}`)
        .send({ name: 'Updated', price: 6000000 })
        .expect(HttpStatus.OK);

      expect(res.body).toMatchObject({
        message: 'Product updated successfully',
        data: { name: 'Updated', slug: 'updated', price: 6000000 },
      });
    });

    it('returns 404 when not found', async () => {
      prismaMock.product.findFirst.mockResolvedValue(null);

      await request(app.getHttpServer())
        .put('/api/v1/products/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${validToken()}`)
        .send({ name: 'Updated', price: 1000 })
        .expect(HttpStatus.NOT_FOUND);
    });
  });

  describe('DELETE /api/v1/products/:id', () => {
    it('returns 200 with success message', async () => {
      prismaMock.product.findFirst.mockResolvedValue(productRecord);
      prismaMock.productCategory.deleteMany.mockResolvedValue(undefined);
      prismaMock.product.delete.mockResolvedValue(productRecord);

      const res = await request(app.getHttpServer())
        .delete(`/api/v1/products/${productId}`)
        .set('Authorization', `Bearer ${validToken()}`)
        .expect(HttpStatus.OK);

      expect(res.body.message).toBe('Product deleted successfully');
      expect(res.body.data).toBeNull();
    });

    it('returns 404 when not found', async () => {
      prismaMock.product.findFirst.mockResolvedValue(null);

      await request(app.getHttpServer())
        .delete('/api/v1/products/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${validToken()}`)
        .expect(HttpStatus.NOT_FOUND);
    });
  });
});
