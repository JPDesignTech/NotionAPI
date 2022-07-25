import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { NotionModule } from './notion/notion.module';

@Module({
  imports: [NotionModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
