import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateQuestionDto } from './create-question.dto';

export class UpdateQuestionDto extends CreateQuestionDto {
  @Transform(({ value }) => value === true || value === 'true')
  @IsOptional()
  @IsBoolean()
  removeImage?: boolean;

  @Transform(({ value }) => value === true || value === 'true')
  @IsOptional()
  @IsBoolean()
  removeAlternative1Image?: boolean;

  @Transform(({ value }) => value === true || value === 'true')
  @IsOptional()
  @IsBoolean()
  removeAlternative2Image?: boolean;

  @Transform(({ value }) => value === true || value === 'true')
  @IsOptional()
  @IsBoolean()
  removeAlternative3Image?: boolean;

  @Transform(({ value }) => value === true || value === 'true')
  @IsOptional()
  @IsBoolean()
  removeAlternative4Image?: boolean;

  @Transform(({ value }) => value === true || value === 'true')
  @IsOptional()
  @IsBoolean()
  removeAlternative5Image?: boolean;
}
