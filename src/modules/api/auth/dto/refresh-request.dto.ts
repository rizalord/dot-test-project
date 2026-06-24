import { IsJWT, IsNotEmpty } from 'class-validator';

export class RefreshRequestDto {
  @IsJWT()
  @IsNotEmpty()
  refresh_token!: string;
}
