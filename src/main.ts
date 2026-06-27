import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { ValidationPipe } from '@nestjs/common'
import { NestExpressApplication } from '@nestjs/platform-express'
import { join } from 'path'
import config, { Config } from './config'
import * as hbs from 'hbs'

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule)
  app.useGlobalPipes(new ValidationPipe())

  app.useStaticAssets(join(__dirname, '..', '..', 'public'))
  app.setBaseViewsDir(join(__dirname, '..', '..', 'views'))
  app.setViewEngine('hbs')

  hbs.registerPartials(join(__dirname, '..', '..', 'views', 'partials'))

  await app.listen(config.port)
}
bootstrap()
