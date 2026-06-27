export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  name: string;
}

export interface AuthUserResource {
  id: string;
  name: string;
  email: string;
  created_at: Date;
  updated_at: Date;
}

export interface RefreshTokenPayload {
  sub: string;
  email: string;
  name: string;
}

export interface AuthTokenResource {
  user: AuthUserResource;
  access_token: string;
  refresh_token: string;
}
