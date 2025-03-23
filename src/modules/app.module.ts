import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { pinoConfig } from 'src/common/logger/logger.config';
import { APP_PIPE } from '@nestjs/core';
import { ZodValidationPipe } from 'nestjs-zod';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';

const FEATURE_MODULES = [UserModule, AuthModule, PrismaModule];
const SHARED_MODULES = [
  ConfigModule.forRoot({
    isGlobal: true,
  }),

  LoggerModule.forRoot({
    pinoHttp: pinoConfig,
  }),
];

@Module({
  providers: [
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
  ],
  imports: [...FEATURE_MODULES, ...SHARED_MODULES],
})
export class AppModule {}
