import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EducationalLevelsController } from './educational_levels.controller';
import { EducationalLevelsService } from './educational_levels.service';
import { EducationalLevel } from './entities/educational_level.entity';

@Module({
  imports: [TypeOrmModule.forFeature([EducationalLevel])],
  controllers: [EducationalLevelsController],
  providers: [EducationalLevelsService],
})
export class EducationalLevelsModule {}
