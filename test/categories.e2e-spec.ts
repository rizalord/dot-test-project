import { INestApplication, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/modules/prisma/prisma.service';
import { buildValidationPipe } from '../src/common/pipes/validation.pipe';

describe('Categories API (e2e)', () => {
  let app: INestApplication<App>;
  let jwtService: JwtService;
  const now = new Date('2026-01-01T00:00:00.000Z');

  const userId = '22222222-2222-2222-2222-222222222222';
  const categoryRecord = {
    id: '33333333-3333-3333-3333-333333333333',
    user_id: userId,
    name: 'Electronics',
    slug: 'electronics',
    created_at: now,
    updated_at: now,
  };

  const prismaMock = {
    category: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
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
    prismaMock.category.findMany.mockReset();
    prismaMock.category.findFirst.mockReset();
    prismaMock.category.create.mockReset();
    prismaMock.category.update.mockReset();
    prismaMock.category.delete.mockReset();
  });

  function validToken(): string {
    return jwtService.sign({
      sub: userId,
      email: 'jane@example.com',
      name: 'Jane',
    });
  }

  describe('GET /api/v1/categories', () => {
    it('returns 401 without bearer token', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/categories')
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('returns 200 with categories list', async () => {
      prismaMock.category.findMany.mockResolvedValue([categoryRecord]);

      const res = await request(app.getHttpServer())
        .get('/api/v1/categories')
        .set('Authorization', `Bearer ${validToken()}`)
        .expect(HttpStatus.OK);

      expect(res.body).toMatchObject({
        message: 'Categories retrieved successfully',
        data: [
          {
            id: categoryRecord.id,
            name: categoryRecord.name,
            slug: categoryRecord.slug,
          },
        ],
      });
    });
  });

  describe('GET /api/v1/categories/:id', () => {
    it('returns 200 with category', async () => {
      prismaMock.category.findFirst.mockResolvedValue(categoryRecord);

      const res = await request(app.getHttpServer())
        .get(`/api/v1/categories/${categoryRecord.id}`)
        .set('Authorization', `Bearer ${validToken()}`)
        .expect(HttpStatus.OK);

      expect(res.body).toMatchObject({
        message: 'Category retrieved successfully',
        data: { id: categoryRecord.id },
      });
    });

    it('returns 404 when not found', async () => {
      prismaMock.category.findFirst.mockResolvedValue(null);

      const res = await request(app.getHttpServer())
        .get('/api/v1/categories/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${validToken()}`)
        .expect(HttpStatus.NOT_FOUND);

      expect(res.body.message).toBe('Category not found');
    });
  });

  describe('POST /api/v1/categories', () => {
    it('returns 201 with created category', async () => {
      prismaMock.category.findFirst.mockResolvedValue(null);
      prismaMock.category.create.mockResolvedValue(categoryRecord);

      const res = await request(app.getHttpServer())
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${validToken()}`)
        .send({ name: 'Electronics' })
        .expect(HttpStatus.CREATED);

      expect(res.body).toMatchObject({
        message: 'Category created successfully',
        data: { name: 'Electronics', slug: 'electronics' },
      });
    });

    it('returns 400 when name is empty', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${validToken()}`)
        .send({ name: '' })
        .expect(HttpStatus.BAD_REQUEST);

      expect(res.body.message.length).toBeGreaterThan(0);
      expect(res.body.error).toBe('Bad Request');
    });

    it('returns 409 when name already exists', async () => {
      prismaMock.category.findFirst.mockResolvedValue(categoryRecord);

      const res = await request(app.getHttpServer())
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${validToken()}`)
        .send({ name: 'Electronics' })
        .expect(HttpStatus.CONFLICT);

      expect(res.body.message).toBe('Category name already exists');
    });
  });

  describe('PUT /api/v1/categories/:id', () => {
    it('returns 200 with updated category', async () => {
      prismaMock.category.findFirst.mockResolvedValueOnce(categoryRecord);
      prismaMock.category.findFirst.mockResolvedValueOnce(null);
      prismaMock.category.update.mockResolvedValue({
        ...categoryRecord,
        name: 'Updated',
        slug: 'updated',
      });

      const res = await request(app.getHttpServer())
        .put(`/api/v1/categories/${categoryRecord.id}`)
        .set('Authorization', `Bearer ${validToken()}`)
        .send({ name: 'Updated' })
        .expect(HttpStatus.OK);

      expect(res.body).toMatchObject({
        message: 'Category updated successfully',
        data: { name: 'Updated', slug: 'updated' },
      });
    });

    it('returns 404 when not found', async () => {
      prismaMock.category.findFirst.mockResolvedValue(null);

      await request(app.getHttpServer())
        .put('/api/v1/categories/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${validToken()}`)
        .send({ name: 'Updated' })
        .expect(HttpStatus.NOT_FOUND);
    });
  });

  describe('DELETE /api/v1/categories/:id', () => {
    it('returns 200 with success message', async () => {
      prismaMock.category.findFirst.mockResolvedValue(categoryRecord);
      prismaMock.category.delete.mockResolvedValue(categoryRecord);

      const res = await request(app.getHttpServer())
        .delete(`/api/v1/categories/${categoryRecord.id}`)
        .set('Authorization', `Bearer ${validToken()}`)
        .expect(HttpStatus.OK);

      expect(res.body.message).toBe('Category deleted successfully');
      expect(res.body.data).toBeNull();
    });

    it('returns 404 when not found', async () => {
      prismaMock.category.findFirst.mockResolvedValue(null);

      await request(app.getHttpServer())
        .delete('/api/v1/categories/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${validToken()}`)
        .expect(HttpStatus.NOT_FOUND);
    });
  });
});
