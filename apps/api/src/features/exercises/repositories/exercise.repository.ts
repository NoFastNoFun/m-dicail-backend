import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';
import { Exercise } from '../entities/exercise.entity';

@Injectable()
export class ExerciseRepository {
  constructor(@InjectRepository(Exercise) private readonly repo: Repository<Exercise>) {}

  findAll(category?: string, query?: string): Promise<Exercise[]> {
    const where: FindOptionsWhere<Exercise> = {};

    if (category) {
      where.category = category;
    }

    if (query) {
      return this.repo.find({
        where: [
          { ...where, name: ILike(`%${query}%`) },
          { ...where, description: ILike(`%${query}%`) },
        ],
        order: { name: 'ASC' },
      });
    }

    return this.repo.find({
      where: Object.keys(where).length > 0 ? where : undefined,
      order: { name: 'ASC' },
    });
  }

  findById(id: string): Promise<Exercise | null> {
    return this.repo.findOne({ where: { id } });
  }

  save(exercise: Partial<Exercise>): Promise<Exercise> {
    return this.repo.save(exercise);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repo.delete({ id });
    return result.affected === 1;
  }
}
