import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Course } from '../courses/entities/course.entity';
import { Question } from '../questions/entities/question.entity';
import { Subject } from '../subjects/entities/subject.entity';
import { User } from '../users/entities/user.entity';
import { ExamAnswer } from './entities/exam-answer.entity';
import { Exam } from './entities/exam.entity';
import { ExamsController } from './exams.controller';
import { ExamsService } from './exams.service';

@Module({
  imports: [TypeOrmModule.forFeature([Exam, ExamAnswer, Course, Subject, Question, User])],
  controllers: [ExamsController],
  providers: [ExamsService],
})
export class ExamsModule {}
