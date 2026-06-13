import { INestApplication, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/modules/prisma/prisma.service';
import { buildValidationPipe } from '../src/common/pipes/validation.pipe';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn(),
}));

describe('Auth API (e2e)', () => {
  let app: INestApplication<App>;
  const now = new Date('2026-01-01T00:00:00.000Z');
  const userRecord = {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Jane',
    email: 'jane@example.com',
    password: 'hashed-password',
    created_at: now,
    updated_at: now,
  };

  const prismaMock = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
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
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    prismaMock.user.findUnique.mockReset();
    prismaMock.user.create.mockReset();
    (bcrypt.compare as jest.Mock).mockReset();
  });

  describe('POST /api/v1/auth/register', () => {
    it('returns 201 with token resource', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.user.create.mockResolvedValue(userRecord);

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          name: 'Jane',
          email: 'jane@example.com',
          password: 'password123',
        })
        .expect(HttpStatus.CREATED);

      expect(res.body).toMatchObject({
        message: 'Registration successful',
        data: {
          user: { id: userRecord.id, name: 'Jane', email: 'jane@example.com' },
          access_token: expect.any(String),
        },
      });
    });

    it('returns 400 when name is empty', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ name: '', email: 'jane@example.com', password: 'password123' })
        .expect(HttpStatus.BAD_REQUEST);

      expect(res.body.message.length).toBeGreaterThan(0);
    });

    it('returns 400 when email is invalid', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ name: 'Jane', email: 'not-email', password: 'password123' })
        .expect(HttpStatus.BAD_REQUEST);

      expect(res.body.message).toBeDefined();
      expect(res.body.error).toBe('Bad Request');
    });

    it('returns 400 when password is too short', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ name: 'Jane', email: 'jane@example.com', password: 'short' })
        .expect(HttpStatus.BAD_REQUEST);

      expect(res.body.message).toBeDefined();
    });

    it('returns 409 when email already registered', async () => {
      prismaMock.user.findUnique.mockResolvedValue(userRecord);

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          name: 'Jane',
          email: 'jane@example.com',
          password: 'password123',
        })
        .expect(HttpStatus.CONFLICT);

      expect(res.body.message).toBe('Email already registered');
      expect(res.body.error).toBe('Conflict');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('returns 200 with token resource on valid credentials', async () => {
      prismaMock.user.findUnique.mockResolvedValue(userRecord);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'jane@example.com', password: 'password123' })
        .expect(HttpStatus.OK);

      expect(res.body.data.access_token).toEqual(expect.any(String));
      expect(res.body.message).toBe('Login successful');
    });

    it('returns 401 when user not found', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'missing@example.com', password: 'password123' })
        .expect(HttpStatus.UNAUTHORIZED);

      expect(res.body.message).toBe('Invalid credentials');
      expect(res.body.error).toBe('Unauthorized');
    });

    it('returns 401 when password is wrong', async () => {
      prismaMock.user.findUnique.mockResolvedValue(userRecord);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'jane@example.com', password: 'wrong-password' })
        .expect(HttpStatus.UNAUTHORIZED);

      expect(res.body.message).toBe('Invalid credentials');
    });

    it('returns 400 when email is missing', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ password: 'password123' })
        .expect(HttpStatus.BAD_REQUEST);

      expect(res.body.error).toBe('Bad Request');
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('returns 401 without bearer token', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('returns 401 with malformed bearer token', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('returns 200 with current user when bearer token valid', async () => {
      prismaMock.user.findUnique.mockResolvedValue(userRecord);
      const jwtService = app.get(JwtService);
      const token = jwtService.sign({
        sub: userRecord.id,
        email: userRecord.email,
        name: userRecord.name,
      });

      const res = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(HttpStatus.OK);

      expect(res.body).toMatchObject({
        message: 'User retrieved successfully',
        data: {
          id: userRecord.id,
          email: userRecord.email,
          name: userRecord.name,
        },
      });
      expect(res.body.data).not.toHaveProperty('password');
    });
  });

  describe('Response format', () => {
    it('returns 404 for unknown route', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/auth/unknown')
        .expect(HttpStatus.NOT_FOUND);

      expect(res.body).toMatchObject({
        message: expect.any(String),
        error: 'Not Found',
      });
    });
  });
});
