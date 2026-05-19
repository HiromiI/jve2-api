import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Board } from '../boards/entities/board.entity';
import { Course } from '../courses/entities/course.entity';
import { EducationalLevel } from '../educational_levels/entities/educational_level.entity';
import { Institution } from '../institutions/entities/institution.entity';
import { Role } from '../roles/entities/role.entity';
import { Skill } from '../skills/entities/skill.entity';
import { Subject } from '../subjects/entities/subject.entity';
import { QuestionSkill } from './entities/question-skill.entity';
import { Question } from './entities/question.entity';
import { QuestionsController } from './questions.controller';
import { QuestionsService } from './questions.service';
import { QuestionsStorageService } from './questions-storage.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Question,
      QuestionSkill,
      Subject,
      Skill,
      Course,
      Role,
      Board,
      Institution,
      EducationalLevel,
    ]),
  ],
  controllers: [QuestionsController],
  providers: [QuestionsService, QuestionsStorageService],
})
export class QuestionsModule {}
