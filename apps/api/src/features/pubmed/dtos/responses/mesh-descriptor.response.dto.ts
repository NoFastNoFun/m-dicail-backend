import { ApiProperty } from '@nestjs/swagger';

export class MeshDescriptorResponseDto {
  @ApiProperty({ example: 'D017116' })
  mesh_ui!: string;

  @ApiProperty({ example: 'Low Back Pain' })
  term!: string;

  @ApiProperty({ type: [String], example: ['Lumbago'] })
  synonyms!: string[];

  @ApiProperty({ type: [String], example: ['C05.116'] })
  tree_numbers!: string[];
}
