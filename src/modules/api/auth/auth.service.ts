import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { Prisma } from '../../../generated/prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterRequestDto } from './dto/register-request.dto';
import { LoginRequestDto } from './dto/login-request.dto';
import { RefreshRequestDto } from './dto/refresh-request.dto';
import { ResponseDto } from '../../../common/dto/response.dto';
import {
  AuthTokenResource,
  AuthUserResource,
  JwtPayload,
  RefreshTokenPayload,
} from './types/auth.types';

@Injectable()
export class AuthService {
  private static readonly BCRYPT_SALT_ROUNDS = 10;
  private readonly refreshSecret: string;
  private readonly refreshExpiresIn: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    const secret = this.configService.get<string>('jwt.refreshSecret');
    const expiresIn =
      this.configService.get<string>('jwt.refreshExpiresIn') ?? '7d';

    if (!secret) {
      throw new Error('JWT_REFRESH_SECRET is not configured');
    }

    this.refreshSecret = secret;
    this.refreshExpiresIn = expiresIn;
  }

  async register(
    dto: RegisterRequestDto,
  ): Promise<ResponseDto<AuthTokenResource>> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(
      dto.password,
      AuthService.BCRYPT_SALT_ROUNDS,
    );

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: hashedPassword,
      },
    });

    return {
      message: 'Registration successful',
      data: this.buildTokenResponse(user),
    };
  }

  async login(dto: LoginRequestDto): Promise<ResponseDto<AuthTokenResource>> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.password);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return {
      message: 'Login successful',
      data: this.buildTokenResponse(user),
    };
  }

  async refresh(
    dto: RefreshRequestDto,
  ): Promise<ResponseDto<AuthTokenResource>> {
    let payload: RefreshTokenPayload;
    try {
      payload = this.jwtService.verify<RefreshTokenPayload>(dto.refresh_token, {
        secret: this.refreshSecret,
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      message: 'Token refreshed successfully',
      data: this.buildTokenResponse(user),
    };
  }

  async me(userId: string): Promise<ResponseDto<AuthUserResource>> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('Unauthenticated user.');
    }

    return {
      message: 'User retrieved successfully',
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        created_at: user.created_at,
        updated_at: user.updated_at,
      },
    };
  }

  private buildTokenResponse(
    user: Prisma.UserGetPayload<Record<string, never>>,
  ): AuthTokenResource {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      name: user.name,
    };

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        created_at: user.created_at,
        updated_at: user.updated_at,
      },
      access_token: this.jwtService.sign(payload),
      refresh_token: this.jwtService.sign(payload, {
        secret: this.refreshSecret,
        expiresIn: this.refreshExpiresIn,
      }),
    };
  }
}
