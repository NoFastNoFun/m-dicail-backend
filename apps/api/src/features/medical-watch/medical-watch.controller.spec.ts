import { Test, TestingModule } from '@nestjs/testing';
import { MedicalWatchController } from './medical-watch.controller';
import { MedicalWatchService } from './services/medical-watch.service';
import { MedicalWatchSpecialty } from './enums/medical-watch-specialty.enum';

describe('MedicalWatchController', () => {
  let controller: MedicalWatchController;
  let service: {
    getArticles: jest.Mock;
    getPreferences: jest.Mock;
    updatePreferences: jest.Mock;
    runManually: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      getArticles: jest.fn().mockResolvedValue([]),
      getPreferences: jest.fn().mockResolvedValue({ digestOptIn: false }),
      updatePreferences: jest.fn().mockResolvedValue({ digestOptIn: true }),
      runManually: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MedicalWatchController],
      providers: [{ provide: MedicalWatchService, useValue: service }],
    }).compile();

    controller = module.get(MedicalWatchController);
  });

  it('getArticles delegates', async () => {
    await controller.getArticles({ specialty: MedicalWatchSpecialty.REHABILITATION, limit: 5 });
    expect(service.getArticles).toHaveBeenCalledWith(MedicalWatchSpecialty.REHABILITATION, 5);
  });

  it('preferences endpoints delegate', async () => {
    await controller.getPreferences('user-1');
    await controller.updatePreferences('user-1', { digestOptIn: true });
    expect(service.getPreferences).toHaveBeenCalledWith('user-1');
    expect(service.updatePreferences).toHaveBeenCalledWith('user-1', true);
  });

  it('triggerManually fires the watch job', async () => {
    await controller.triggerManually();
    expect(service.runManually).toHaveBeenCalled();
  });
});
