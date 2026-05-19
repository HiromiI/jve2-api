import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { CreateCourseDto } from './dto/create-course.dto';
import { ListCoursesQueryDto } from './dto/list-courses-query.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { Course } from './entities/course.entity';
import { CourseImageFile } from './interfaces/course-image-file.interface';
import { CoursesStorageService } from './courses-storage.service';

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(Course)
    private readonly coursesRepository: Repository<Course>,
    private readonly coursesStorageService: CoursesStorageService,
  ) {}

  async create(createCourseDto: CreateCourseDto, imageFile?: CourseImageFile) {
    await this.ensureCourseNameIsAvailable(createCourseDto.name);

    const course = this.coursesRepository.create({
      name: createCourseDto.name.trim(),
      description: createCourseDto.description?.trim() ?? null,
      image: null,
      planCode: createCourseDto.planCode?.trim() ?? null,
      price: createCourseDto.price?.trim() ?? null,
    });

    const savedCourse = await this.coursesRepository.save(course);

    if (!imageFile) {
      return savedCourse;
    }

    try {
      savedCourse.image = await this.coursesStorageService.uploadCourseImage({
        courseId: savedCourse.id,
        courseName: savedCourse.name,
        file: imageFile,
      });

      return await this.coursesRepository.save(savedCourse);
    } catch (error) {
      await this.coursesRepository.remove(savedCourse);

      if (error instanceof Error) {
        throw error;
      }

      throw new InternalServerErrorException('Erro ao salvar o banner do Curso.');
    }
  }

  async findAll(query: ListCoursesQueryDto) {
    const limit = query.limit ?? 10;
    const offset = query.offset ?? 0;
    const [items, total] = await this.coursesRepository.findAndCount({
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

  async findById(id: number) {
    return this.findEntityById(id);
  }

  async update(id: number, updateCourseDto: UpdateCourseDto, imageFile?: CourseImageFile) {
    const course = await this.findEntityById(id);

    await this.ensureCourseNameIsAvailable(updateCourseDto.name, id);

    const nextName = updateCourseDto.name.trim();
    const nextDescription = updateCourseDto.description?.trim() ?? null;
    const nextPlanCode = updateCourseDto.planCode?.trim() ?? null;
    const nextPrice = updateCourseDto.price?.trim() ?? null;
    const nextImage = imageFile
      ? await this.coursesStorageService.uploadCourseImage({
          courseId: course.id,
          courseName: nextName,
          file: imageFile,
        })
      : updateCourseDto.removeImage
        ? null
        : course.image;

    course.name = nextName;
    course.description = nextDescription;
    course.planCode = nextPlanCode;
    course.price = nextPrice;
    course.image = nextImage;

    return this.coursesRepository.save(course);
  }

  async remove(id: number) {
    const course = await this.findEntityById(id);

    await this.coursesRepository.softRemove(course);

    return {
      message: 'Curso excluído com sucesso.',
    };
  }

  private async ensureCourseNameIsAvailable(name: string, currentCourseId?: number) {
    const normalizedName = name.trim().toLowerCase();
    const existingCourse = await this.coursesRepository
      .createQueryBuilder('course')
      .where('LOWER(course.name) = :normalizedName', { normalizedName })
      .andWhere('course.deletedAt IS NULL')
      .getOne();

    if (existingCourse && existingCourse.id !== currentCourseId) {
      throw new ConflictException('Curso já cadastrado.');
    }
  }

  private async findEntityById(id: number) {
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
}
