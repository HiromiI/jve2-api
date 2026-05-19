import { Transform, Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

const trimToUndefined = (value: unknown) => {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmedValue = value.trim();

  return trimmedValue ? trimmedValue : undefined;
};

export class ListQuestionsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  roleId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  boardId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  institutionId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  educationalLevelId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(9999)
  year?: number;

  @IsOptional()
  @Transform(({ value }) => trimToUndefined(value))
  @IsString()
  search?: string;
}
