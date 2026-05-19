import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateEducationalLevelDto } from './dto/create-educational-level.dto';
import { ListEducationalLevelsQueryDto } from './dto/list-educational-levels-query.dto';
import { UpdateEducationalLevelDto } from './dto/update-educational-level.dto';
import { EducationalLevelsService } from './educational_levels.service';

@UseGuards(JwtAuthGuard)
@Controller('educational_levels')
export class EducationalLevelsController {
  constructor(private readonly educationalLevelsService: EducationalLevelsService) {}

  @Get()
  findAll(@Query() query: ListEducationalLevelsQueryDto) {
    return this.educationalLevelsService.findAll(query);
  }

  @Post()
  create(@Body() createEducationalLevelDto: CreateEducationalLevelDto) {
    return this.educationalLevelsService.create(createEducationalLevelDto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEducationalLevelDto: UpdateEducationalLevelDto,
  ) {
    return this.educationalLevelsService.update(id, updateEducationalLevelDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.educationalLevelsService.remove(id);
  }
}
