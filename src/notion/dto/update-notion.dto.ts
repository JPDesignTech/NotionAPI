import { PartialType } from '@nestjs/mapped-types';
import { CreateNotionDto } from './create-notion.dto';

export class UpdateNotionDto extends PartialType(CreateNotionDto) {}
