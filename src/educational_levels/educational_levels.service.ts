import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateEducationalLevelDto } from './dto/create-educational-level.dto';
import { ListEducationalLevelsQueryDto } from './dto/list-educational-levels-query.dto';
import { UpdateEducationalLevelDto } from './dto/update-educational-level.dto';
import { EducationalLevel } from './entities/educational_level.entity';

@Injectable()
export class EducationalLevelsService {
  constructor(
    @InjectRepository(EducationalLevel)
    private readonly educationalLevelsRepository: Repository<EducationalLevel>,
  ) {}

  async create(createEducationalLevelDto: CreateEducationalLevelDto) {
    const educationalLevel = this.educationalLevelsRepository.create({
      description: createEducationalLevelDto.description.trim(),
    });

    return this.educationalLevelsRepository.save(educationalLevel);
  }

  async findAll(query: ListEducationalLevelsQueryDto) {
    const limit = query.limit ?? 10;
    const offset = query.offset ?? 0;
    const [items, total] = await this.educationalLevelsRepository.findAndCount({
      order: {
        description: 'ASC',
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

  async update(id: number, updateEducationalLevelDto: UpdateEducationalLevelDto) {
    const educationalLevel = await this.findEntityById(id);

    educationalLevel.description = updateEducationalLevelDto.description.trim();

    return this.educationalLevelsRepository.save(educationalLevel);
  }

  async remove(id: number) {
    const educationalLevel = await this.findEntityById(id);

    await this.educationalLevelsRepository.softRemove(educationalLevel);

    return {
      message: 'Nível de Escolaridade excluído com sucesso.',
    };
  }

  private async findEntityById(id: number) {
    const educationalLevel = await this.educationalLevelsRepository.findOne({
      where: { id },
    });

    if (!educationalLevel) {
      throw new NotFoundException('Nível de Escolaridade não encontrado.');
    }

    return educationalLevel;
  }
}
