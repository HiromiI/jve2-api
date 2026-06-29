import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';
import { CoursesStorageService } from './courses-storage.service';
import { Course } from './entities/course.entity';
import { Exam } from '../exams/entities/exam.entity';
import { Payment } from '../payments/entities/payment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Course, Payment, Exam])],
  controllers: [CoursesController],
  providers: [CoursesService, CoursesStorageService],
})
export class CoursesModule {}
