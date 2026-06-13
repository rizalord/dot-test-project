import { Module } from '@nestjs/common';
import { AuthPageController } from './auth-page.controller';

@Module({
  controllers: [AuthPageController],
})
export class WebAuthModule {}
