import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateInstitutionDto } from './dto/create-institution.dto';
import { ListInstitutionsQueryDto } from './dto/list-institutions-query.dto';
import { UpdateInstitutionDto } from './dto/update-institution.dto';
import { Institution } from './entities/institution.entity';

@Injectable()
export class InstitutionsService {
  constructor(
    @InjectRepository(Institution)
    private readonly institutionsRepository: Repository<Institution>,
  ) {}

  async create(createInstitutionDto: CreateInstitutionDto) {
    const institution = this.institutionsRepository.create({
      description: createInstitutionDto.description.trim(),
    });

    return this.institutionsRepository.save(institution);
  }

  async findAll(query: ListInstitutionsQueryDto) {
    const limit = query.limit ?? 10;
    const offset = query.offset ?? 0;
    const [items, total] = await this.institutionsRepository.findAndCount({
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

  async update(id: number, updateInstitutionDto: UpdateInstitutionDto) {
    const institution = await this.findEntityById(id);

    institution.description = updateInstitutionDto.description.trim();

    return this.institutionsRepository.save(institution);
  }

  async remove(id: number) {
    const institution = await this.findEntityById(id);

    await this.institutionsRepository.softRemove(institution);

    return {
      message: 'Instituição excluída com sucesso.',
    };
  }

  private async findEntityById(id: number) {
    const institution = await this.institutionsRepository.findOne({
      where: { id },
    });

    if (!institution) {
      throw new NotFoundException('Instituição não encontrada.');
    }

    return institution;
  }
}
