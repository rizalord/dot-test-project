import { Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { Strategy } from 'passport-local'
import { AuthenticatedUser } from 'src/modules/api/auth/types/auth.types'
import { AuthService } from '../../../api/auth/auth.service'

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
    constructor(private readonly authService: AuthService) {
        super({
            usernameField: 'email',
            passwordField: 'password'
        })
    }

    async validate(email: string, password: string): Promise<AuthenticatedUser> {
        const user = await this.authService.login({ email, password })

        if (!user) {
            throw new Error('Invalid credentials')
        }

        return user.data.user
    }
}
