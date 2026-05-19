import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateBoardDto } from './dto/create-board.dto';
import { ListBoardsQueryDto } from './dto/list-boards-query.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { Board } from './entities/board.entity';

@Injectable()
export class BoardsService {
  constructor(
    @InjectRepository(Board)
    private readonly boardsRepository: Repository<Board>,
  ) {}

  async create(createBoardDto: CreateBoardDto) {
    const board = this.boardsRepository.create({
      description: createBoardDto.description.trim(),
    });

    return this.boardsRepository.save(board);
  }

  async findAll(query: ListBoardsQueryDto) {
    const limit = query.limit ?? 10;
    const offset = query.offset ?? 0;
    const [items, total] = await this.boardsRepository.findAndCount({
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

  async update(id: number, updateBoardDto: UpdateBoardDto) {
    const board = await this.findEntityById(id);

    board.description = updateBoardDto.description.trim();

    return this.boardsRepository.save(board);
  }

  async remove(id: number) {
    const board = await this.findEntityById(id);

    await this.boardsRepository.softRemove(board);

    return {
      message: 'Banca excluída com sucesso.',
    };
  }

  private async findEntityById(id: number) {
    const board = await this.boardsRepository.findOne({
      where: { id },
    });

    if (!board) {
      throw new NotFoundException('Banca não encontrada.');
    }

    return board;
  }
}
