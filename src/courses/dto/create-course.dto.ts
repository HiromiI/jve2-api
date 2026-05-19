import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';

const trimToUndefined = (value: unknown) => {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmedValue = value.trim();

  return trimmedValue ? trimmedValue : undefined;
};

export class CreateCourseDto {
  @Transform(({ value }) => trimToUndefined(value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @Transform(({ value }) => trimToUndefined(value))
  @IsOptional()
  @IsString()
  description?: string;

  @Transform(({ value }) => trimToUndefined(value))
  @IsOptional()
  @IsString()
  @MaxLength(255)
  planCode?: string;

  @Transform(({ value }) => trimToUndefined(value))
  @ValidateIf((object) => Boolean(object.planCode) || object.price !== undefined)
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d+(\.\d{1,2})?$/)
  price?: string;
}
