import { ApiProperty } from '@nestjs/swagger';
import { Exercise } from '../../entities/exercise.entity';

export class ExerciseResponseDto {
  @ApiProperty() declare id: string;
  @ApiProperty() declare name: string;
  @ApiProperty() declare description: string;
  @ApiProperty() declare category: string;
  @ApiProperty() declare instructions: string;
  @ApiProperty({ nullable: true }) declare video_url: string | null;
  @ApiProperty({ nullable: true }) declare image_url: string | null;
  @ApiProperty() declare created_at: Date;
  @ApiProperty() declare updated_at: Date;

  constructor(exercise: Exercise) {
    this.id = exercise.id;
    this.name = exercise.name;
    this.description = exercise.description;
    this.category = exercise.category;
    this.instructions = exercise.instructions;
    this.video_url = exercise.videoUrl;
    this.image_url = exercise.imageUrl;
    this.created_at = exercise.createdAt;
    this.updated_at = exercise.updatedAt;
  }
}
