import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Course } from '../courses/entities/course.entity';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { ListSubjectsQueryDto } from './dto/list-subjects-query.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { Subject } from './entities/subject.entity';

@Injectable()
export class SubjectsService {
  constructor(
    @InjectRepository(Subject)
    private readonly subjectsRepository: Repository<Subject>,
    @InjectRepository(Course)
    private readonly coursesRepository: Repository<Course>,
  ) {}

  async create(courseId: number, createSubjectDto: CreateSubjectDto) {
    const course = await this.findActiveCourseById(courseId);

    await this.ensureSubjectNameIsAvailable(course.id, course.name, createSubjectDto.name);

    const subject = this.subjectsRepository.create({
      courseId: course.id,
      name: createSubjectDto.name.trim(),
      description: createSubjectDto.description?.trim() ?? null,
    });

    return this.subjectsRepository.save(subject);
  }

  async findAll(courseId: number, query: ListSubjectsQueryDto) {
    await this.findActiveCourseById(courseId);

    const limit = query.limit ?? 10;
    const offset = query.offset ?? 0;
    const [items, total] = await this.subjectsRepository.findAndCount({
      where: {
        courseId,
      },
      order: {
        name: 'ASC',
      },
      take: limit,
      skip: offset,
    });

    return {
      items,
      total,
      limit,
      offset,
      hasMore: offset + items.length < total,
    };
  }

  async findById(courseId: number, id: number) {
    await this.findActiveCourseById(courseId);

    return this.findEntityById(courseId, id);
  }

  async update(courseId: number, id: number, updateSubjectDto: UpdateSubjectDto) {
    const course = await this.findActiveCourseById(courseId);
    const subject = await this.findEntityById(course.id, id);

    await this.ensureSubjectNameIsAvailable(course.id, course.name, updateSubjectDto.name, id);

    subject.name = updateSubjectDto.name.trim();
    subject.description = updateSubjectDto.description?.trim() ?? null;

    return this.subjectsRepository.save(subject);
  }

  async remove(courseId: number, id: number) {
    await this.findActiveCourseById(courseId);

    const subject = await this.findEntityById(courseId, id);

    await this.subjectsRepository.softRemove(subject);

    return {
      message: 'Disciplina excluída com sucesso.',
    };
  }

  private async ensureSubjectNameIsAvailable(
    courseId: number,
    courseName: string,
    name: string,
    currentSubjectId?: number,
  ) {
    const normalizedName = name.trim().toLowerCase();
    const existingSubject = await this.subjectsRepository
      .createQueryBuilder('subject')
      .where('subject.courseId = :courseId', { courseId })
      .andWhere('LOWER(subject.name) = :normalizedName', { normalizedName })
      .andWhere('subject.deletedAt IS NULL')
      .getOne();

    if (existingSubject && existingSubject.id !== currentSubjectId) {
      throw new ConflictException(`Disciplina já cadastrada para o curso ${courseName}.`);
    }
  }

  private async findActiveCourseById(id: number) {
    const course = await this.coursesRepository.findOne({
      where: {
        id,
        deletedAt: IsNull(),
      },
    });

    if (!course) {
      throw new NotFoundException('Curso não encontrado.');
    }

    return course;
  }

  private async findEntityById(courseId: number, id: number) {
    const subject = await this.subjectsRepository.findOne({
      where: {
        id,
        courseId,
        deletedAt: IsNull(),
      },
    });

    if (!subject) {
      throw new NotFoundException('Disciplina não encontrada.');
    }

    return subject;
  }
}
