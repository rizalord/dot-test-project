import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

jest.mock('../../prisma/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

import { PrismaService } from '../../prisma/prisma.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const now = new Date('2026-01-01T00:00:00.000Z');
  const baseUser = {
    id: 'user-1',
    name: 'Jane',
    email: 'jane@example.com',
    password: 'hashed',
    created_at: now,
    updated_at: now,
  };

  const configMock = {
    get: jest.fn((key: string) => {
      if (key === 'jwt.refreshSecret') return 'refresh-secret';
      if (key === 'jwt.refreshExpiresIn') return '7d';
      return undefined;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: { user: { findUnique: jest.fn(), create: jest.fn() } },
        },
        {
          provide: JwtService,
          useValue: { sign: jest.fn().mockReturnValue('token') },
        },
        { provide: ConfigService, useValue: configMock },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('calls authService.register and returns result', async () => {
      const dto = {
        name: 'Jane',
        email: 'jane@example.com',
        password: 'password123',
      };
      const expected = {
        message: 'Registration successful',
        data: {
          user: {
            id: baseUser.id,
            name: baseUser.name,
            email: baseUser.email,
            created_at: baseUser.created_at,
            updated_at: baseUser.updated_at,
          },
          access_token: 'token',
        },
      };
      jest.spyOn(authService, 'register').mockResolvedValue(expected);

      const result = await controller.register(dto);

      expect(result).toEqual(expected);
      expect(authService.register).toHaveBeenCalledWith(dto);
    });
  });

  describe('login', () => {
    it('calls authService.login and returns result', async () => {
      const dto = { email: 'jane@example.com', password: 'password123' };
      const expected = {
        message: 'Login successful',
        data: {
          user: {
            id: baseUser.id,
            name: baseUser.name,
            email: baseUser.email,
            created_at: baseUser.created_at,
            updated_at: baseUser.updated_at,
          },
          access_token: 'token',
        },
      };
      jest.spyOn(authService, 'login').mockResolvedValue(expected);

      const result = await controller.login(dto);

      expect(result).toEqual(expected);
      expect(authService.login).toHaveBeenCalledWith(dto);
    });
  });

  describe('refresh', () => {
    it('calls authService.refresh with refresh token and returns result', async () => {
      const dto = { refresh_token: 'valid-refresh-token' };
      const expected = {
        message: 'Token refreshed successfully',
        data: {
          user: {
            id: baseUser.id,
            name: baseUser.name,
            email: baseUser.email,
            created_at: baseUser.created_at,
            updated_at: baseUser.updated_at,
          },
          access_token: 'token',
          refresh_token: 'token',
        },
      };
      jest.spyOn(authService, 'refresh').mockResolvedValue(expected);

      const result = await controller.refresh(dto);

      expect(result).toEqual(expected);
      expect(authService.refresh).toHaveBeenCalledWith(dto);
    });
  });

  describe('me', () => {
    it('calls authService.me with current user id and returns result', async () => {
      const user = { id: 'user-1', email: 'jane@example.com', name: 'Jane' };
      const expected = {
        message: 'User retrieved successfully',
        data: {
          id: baseUser.id,
          name: baseUser.name,
          email: baseUser.email,
          created_at: baseUser.created_at,
          updated_at: baseUser.updated_at,
        },
      };
      jest.spyOn(authService, 'me').mockResolvedValue(expected);

      const result = await controller.me(user);

      expect(result).toEqual(expected);
      expect(authService.me).toHaveBeenCalledWith('user-1');
    });
  });
});
