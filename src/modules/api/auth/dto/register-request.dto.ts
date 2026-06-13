import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator'

export class RegisterRequestDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string

  @IsEmail()
  @MaxLength(255)
  email: string

  @IsString()
  @MinLength(8)
  @MaxLength(255)
  password: string
}
