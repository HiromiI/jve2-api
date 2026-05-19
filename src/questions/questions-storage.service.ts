import { randomUUID } from 'crypto';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { QuestionImageFile } from './interfaces/question-image-file.interface';

interface UploadQuestionImageParams {
  courseId: number;
  subjectId: number;
  questionId: number;
  file: QuestionImageFile;
  fileNamePrefix: string;
  folderSuffix?: string;
}

@Injectable()
export class QuestionsStorageService {
  constructor(private readonly configService: ConfigService) {}

  async uploadQuestionImage(params: UploadQuestionImageParams) {
    const { bucketName, endpoint, s3Client } = this.getStorageClient();
    const { courseId, subjectId, questionId, file, fileNamePrefix, folderSuffix } = params;

    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Arquivo de imagem inválido.');
    }

    const extension = this.resolveExtension(file);
    const folderPath = folderSuffix
      ? `JVE/Courses/${courseId}/Subjects/${subjectId}/Questions/${questionId}/${folderSuffix}`
      : `JVE/Courses/${courseId}/Subjects/${subjectId}/Questions/${questionId}`;
    const key = `${folderPath}/${fileNamePrefix}-${randomUUID()}.${extension}`;

    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: file.buffer,
        ACL: 'public-read',
        ContentType: file.mimetype,
      }),
    );

    const publicUrl = this.resolvePublicUrl(endpoint, bucketName, key);

    if (publicUrl.length > 255) {
      throw new InternalServerErrorException('A URL da imagem excede o tamanho permitido.');
    }

    return publicUrl;
  }

  private resolveExtension(file: QuestionImageFile) {
    const originalExtension = file.originalname.split('.').pop()?.trim().toLowerCase();

    if (originalExtension) {
      return originalExtension;
    }

    const mimeExtension = file.mimetype.split('/').pop()?.trim().toLowerCase();

    if (!mimeExtension) {
      throw new BadRequestException('Arquivo de imagem inválido.');
    }

    return mimeExtension;
  }

  private getStorageClient() {
    const accessKeyId = this.configService.get<string>('DO_SPACES_ACCESS_KEY')?.trim();
    const secretAccessKey = this.configService.get<string>('DO_SPACES_SECRET_KEY')?.trim();
    const bucketName = this.configService.get<string>('DO_SPACES_BUCKET')?.trim();
    const endpoint = this.configService.get<string>('DO_SPACES_ENDPOINT')?.trim()?.replace(/\/+$/, '');

    if (!accessKeyId || !secretAccessKey || !bucketName || !endpoint) {
      throw new InternalServerErrorException('Configuração do armazenamento de Questões não encontrada.');
    }

    let region = 'us-east-1';

    try {
      const endpointUrl = new URL(endpoint);
      const [derivedRegion] = endpointUrl.hostname.split('.');

      if (derivedRegion) {
        region = derivedRegion;
      }
    } catch {
      region = 'us-east-1';
    }

    return {
      bucketName,
      endpoint,
      s3Client: new S3Client({
        region,
        endpoint,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      }),
    };
  }

  private resolvePublicUrl(endpoint: string, bucketName: string, key: string) {
    try {
      const endpointUrl = new URL(endpoint);
      const endpointAlreadyContainsBucket =
        endpointUrl.hostname.startsWith(`${bucketName}.`) || endpointUrl.pathname.split('/').includes(bucketName);

      return endpointAlreadyContainsBucket ? `${endpoint}/${key}` : `${endpoint}/${bucketName}/${key}`;
    } catch {
      return `${endpoint}/${bucketName}/${key}`;
    }
  }
}
