import { JwtConfig } from './jwt'

export class Config {
    port: number
    database: {
        url: string
    }
    jwt: JwtConfig
}

export default function config(): Config {
    return {
        port: parseInt(process.env.PORT) || 3000,
        database: {
            url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@db:5432/adminpanel?schema=public',
        },
        jwt: {
            secret: process.env.JWT_SECRET || 'your-secret-key',
            expiresIn: process.env.JWT_EXPIRES_IN || '1h',
            refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
            refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
        }
    }
}