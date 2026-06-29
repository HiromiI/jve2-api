import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateExamDto } from './dto/create-exam.dto';
import { ListUserExamsQueryDto } from './dto/list-user-exams-query.dto';
import { UpdateExamAnswerDto } from './dto/update-exam-answer.dto';
import { ExamsService } from './exams.service';

type AuthenticatedRequest = {
  user: {
    userId: number;
  };
};

@UseGuards(JwtAuthGuard)
@Controller('exams')
export class ExamsController {
  constructor(private readonly examsService: ExamsService) {}

  @Post()
  create(@Req() request: AuthenticatedRequest, @Body() createExamDto: CreateExamDto) {
    return this.examsService.create(request.user.userId, createExamDto);
  }

  @Get('user-exams')
  findUserExams(@Req() request: AuthenticatedRequest, @Query() query: ListUserExamsQueryDto) {
    return this.examsService.findUserExams(request.user.userId, query);
  }

  @Get(':examId/answers')
  findAnswers(@Req() request: AuthenticatedRequest, @Param('examId', ParseIntPipe) examId: number) {
    return this.examsService.findAnswers(request.user.userId, examId);
  }

  @Patch(':examId/answers/:answerId')
  updateAnswer(
    @Req() request: AuthenticatedRequest,
    @Param('examId', ParseIntPipe) examId: number,
    @Param('answerId', ParseIntPipe) answerId: number,
    @Body() updateExamAnswerDto: UpdateExamAnswerDto,
  ) {
    return this.examsService.updateAnswer(request.user.userId, examId, answerId, updateExamAnswerDto.answer);
  }

  @Post(':examId/finish')
  finish(@Req() request: AuthenticatedRequest, @Param('examId', ParseIntPipe) examId: number) {
    return this.examsService.finish(request.user.userId, examId);
  }

  @Get(':examId/result')
  getResult(@Req() request: AuthenticatedRequest, @Param('examId', ParseIntPipe) examId: number) {
    return this.examsService.getResult(request.user.userId, examId);
  }
}
