import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import * as bcrypt from 'bcrypt';

jest.mock('../../prisma/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

import { PrismaService } from '../../prisma/prisma.service';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: {
    user: {
      findUnique: jest.Mock;
      create: jest.Mock;
    };
  };
  let jwt: { sign: jest.Mock };

  const now = new Date('2026-01-01T00:00:00.000Z');
  const baseUser = {
    id: 'user-1',
    name: 'Jane',
    email: 'jane@example.com',
    password: 'hashed',
    created_at: now,
    updated_at: now,
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    };
    jwt = { sign: jest.fn().mockReturnValue('signed.jwt.token') };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwt },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('throws ConflictException when email already exists', async () => {
      prisma.user.findUnique.mockResolvedValue(baseUser);

      await expect(
        service.register({
          name: 'Jane',
          email: 'jane@example.com',
          password: 'password123',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('hashes password and creates user, returns token resource', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(baseUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');

      const result = await service.register({
        name: 'Jane',
        email: 'jane@example.com',
        password: 'password123',
      });

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          name: 'Jane',
          email: 'jane@example.com',
          password: 'hashed',
        },
      });
      expect(result).toEqual({
        message: 'Registration successful',
        data: {
          user: {
            id: baseUser.id,
            name: baseUser.name,
            email: baseUser.email,
            created_at: baseUser.created_at,
            updated_at: baseUser.updated_at,
          },
          access_token: 'signed.jwt.token',
        },
      });
    });
  });

  describe('login', () => {
    it('throws UnauthorizedException when user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: 'jane@example.com', password: 'password123' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('throws UnauthorizedException when password does not match', async () => {
      prisma.user.findUnique.mockResolvedValue(baseUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({ email: 'jane@example.com', password: 'wrong' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('returns token resource on valid credentials', async () => {
      prisma.user.findUnique.mockResolvedValue(baseUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login({
        email: 'jane@example.com',
        password: 'password123',
      });

      expect(result.data.access_token).toBe('signed.jwt.token');
      expect(result.data.user.email).toBe(baseUser.email);
    });
  });

  describe('me', () => {
    it('throws UnauthorizedException when user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.me('missing-id')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('returns user resource without password', async () => {
      prisma.user.findUnique.mockResolvedValue(baseUser);

      const result = await service.me('user-1');

      expect(result).toEqual({
        message: 'User retrieved successfully',
        data: {
          id: baseUser.id,
          name: baseUser.name,
          email: baseUser.email,
          created_at: baseUser.created_at,
          updated_at: baseUser.updated_at,
        },
      });
      expect(result.data).not.toHaveProperty('password');
    });
  });
});
