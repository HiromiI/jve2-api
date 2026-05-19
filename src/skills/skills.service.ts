import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Course } from '../courses/entities/course.entity';
import { Subject } from '../subjects/entities/subject.entity';
import { CreateSkillDto } from './dto/create-skill.dto';
import { ListSkillsQueryDto } from './dto/list-skills-query.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';
import { Skill } from './entities/skill.entity';

@Injectable()
export class SkillsService {
  constructor(
    @InjectRepository(Skill)
    private readonly skillsRepository: Repository<Skill>,
    @InjectRepository(Subject)
    private readonly subjectsRepository: Repository<Subject>,
    @InjectRepository(Course)
    private readonly coursesRepository: Repository<Course>,
  ) {}

  async create(courseId: number, subjectId: number, createSkillDto: CreateSkillDto) {
    const subject = await this.findActiveSubjectById(courseId, subjectId);

    await this.ensureSkillNameIsAvailable(subject.id, subject.name, createSkillDto.name);

    const skill = this.skillsRepository.create({
      subjectId: subject.id,
      name: createSkillDto.name.trim(),
      description: createSkillDto.description?.trim() ?? null,
    });

    return this.skillsRepository.save(skill);
  }

  async findAll(courseId: number, subjectId: number, query: ListSkillsQueryDto) {
    await this.findActiveSubjectById(courseId, subjectId);

    const limit = query.limit ?? 10;
    const offset = query.offset ?? 0;
    const [items, total] = await this.skillsRepository.findAndCount({
      where: {
        subjectId,
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

  async update(courseId: number, subjectId: number, id: number, updateSkillDto: UpdateSkillDto) {
    const subject = await this.findActiveSubjectById(courseId, subjectId);
    const skill = await this.findEntityById(subject.id, id);

    await this.ensureSkillNameIsAvailable(subject.id, subject.name, updateSkillDto.name, id);

    skill.name = updateSkillDto.name.trim();
    skill.description = updateSkillDto.description?.trim() ?? null;

    return this.skillsRepository.save(skill);
  }

  async remove(courseId: number, subjectId: number, id: number) {
    await this.findActiveSubjectById(courseId, subjectId);

    const skill = await this.findEntityById(subjectId, id);

    await this.skillsRepository.softRemove(skill);

    return {
      message: 'Skill excluída com sucesso.',
    };
  }

  private async ensureSkillNameIsAvailable(
    subjectId: number,
    subjectName: string,
    name: string,
    currentSkillId?: number,
  ) {
    const normalizedName = name.trim().toLowerCase();
    const existingSkill = await this.skillsRepository
      .createQueryBuilder('skill')
      .where('skill.subjectId = :subjectId', { subjectId })
      .andWhere('LOWER(skill.name) = :normalizedName', { normalizedName })
      .andWhere('skill.deletedAt IS NULL')
      .getOne();

    if (existingSkill && existingSkill.id !== currentSkillId) {
      throw new ConflictException(`Skill já cadastrada para a disciplina ${subjectName}.`);
    }
  }

  private async findActiveSubjectById(courseId: number, subjectId: number) {
    const course = await this.coursesRepository.findOne({
      where: {
        id: courseId,
        deletedAt: IsNull(),
      },
    });

    if (!course) {
      throw new NotFoundException('Curso não encontrado.');
    }

    const subject = await this.subjectsRepository.findOne({
      where: {
        id: subjectId,
        courseId,
        deletedAt: IsNull(),
      },
    });

    if (!subject) {
      throw new NotFoundException('Disciplina não encontrada.');
    }

    return subject;
  }

  private async findEntityById(subjectId: number, id: number) {
    const skill = await this.skillsRepository.findOne({
      where: {
        id,
        subjectId,
        deletedAt: IsNull(),
      },
    });

    if (!skill) {
      throw new NotFoundException('Skill não encontrada.');
    }

    return skill;
  }
}
