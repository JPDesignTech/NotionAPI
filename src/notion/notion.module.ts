import { Module } from '@nestjs/common';
import { NotionService } from './notion.service';
import { NotionController } from './notion.controller';
import { AppService } from 'src/app.service';

@Module({
    controllers: [NotionController],
    providers: [NotionService, AppService],
})
export class NotionModule {}
