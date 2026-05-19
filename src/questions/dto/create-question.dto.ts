import { Transform, Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

const trimToUndefined = (value: unknown) => {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmedValue = value.trim();

  return trimmedValue ? trimmedValue : undefined;
};

const transformToNumberArray = ({ value }: { value: unknown }) => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (Array.isArray(value)) {
    return value.map((item) => Number(item));
  }

  if (typeof value === 'string') {
    try {
      const parsedValue = JSON.parse(value) as unknown;

      if (Array.isArray(parsedValue)) {
        return parsedValue.map((item) => Number(item));
      }
    } catch {
      return value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
        .map((item) => Number(item));
    }
  }

  return undefined;
};

export class CreateQuestionDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  roleId: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  boardId: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  institutionId: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  educationalLevelId: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(9999)
  year: number;

  @Transform(({ value }) => trimToUndefined(value))
  @IsString()
  @IsNotEmpty()
  question: string;

  @Transform(({ value }) => trimToUndefined(value))
  @IsString()
  @IsNotEmpty()
  alternative1: string;

  @Transform(({ value }) => trimToUndefined(value))
  @IsString()
  @IsNotEmpty()
  alternative2: string;

  @Transform(({ value }) => trimToUndefined(value))
  @IsString()
  @IsNotEmpty()
  alternative3: string;

  @Transform(({ value }) => trimToUndefined(value))
  @IsString()
  @IsNotEmpty()
  alternative4: string;

  @Transform(({ value }) => trimToUndefined(value))
  @IsString()
  @IsNotEmpty()
  alternative5: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  correctAlternative: number;

  @Transform(transformToNumberArray)
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  @Min(1, { each: true })
  skillIds?: number[];
}
