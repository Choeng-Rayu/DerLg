import { Test, TestingModule } from '@nestjs/testing';
import { jest } from '@jest/globals';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { HealthService } from './common/health.service.js';
import { PrismaService } from './prisma/prisma.service.js';
import { RedisService } from './redis/redis.service.js';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        HealthService,
        {
          provide: PrismaService,
          useValue: {
            $queryRaw: jest.fn<any>().mockResolvedValue([{ 1: 1 }]),
          },
        },
        {
          provide: RedisService,
          useValue: {
            get: jest.fn<any>().mockResolvedValue('ok'),
          },
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });

  describe('health', () => {
    it('should return health status', async () => {
      const result = await appController.getHealth();
      expect(result.status).toBe('ok');
      expect(result.services.database).toBe('up');
      expect(result.services.redis).toBe('up');
    });
  });
});
