import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class CreateExamDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  courseId: number;
}
