import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Course } from '../courses/entities/course.entity';
import { Subject } from '../subjects/entities/subject.entity';
import { Skill } from './entities/skill.entity';
import { SkillsController } from './skills.controller';
import { SkillsService } from './skills.service';

@Module({
  imports: [TypeOrmModule.forFeature([Skill, Subject, Course])],
  controllers: [SkillsController],
  providers: [SkillsService],
})
export class SkillsModule {}
