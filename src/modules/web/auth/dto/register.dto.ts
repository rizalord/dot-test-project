import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator'

export class RegisterDto {
    @IsEmail()
    @MaxLength(255)
    email: string

    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    name: string

    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    password: string

    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    confirmPassword: string
}
