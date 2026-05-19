import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

const trimToUndefined = (value: unknown) => {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmedValue = value.trim();

  return trimmedValue ? trimmedValue : undefined;
};

export class CreateSkillDto {
  @Transform(({ value }) => trimToUndefined(value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @Transform(({ value }) => trimToUndefined(value))
  @IsOptional()
  @IsString()
  description?: string;
}
