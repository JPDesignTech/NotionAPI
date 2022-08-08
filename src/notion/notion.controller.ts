import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { NotionService } from './notion.service';
import { CreateNotionDto } from './dto/create-notion.dto';
import { UpdateNotionDto } from './dto/update-notion.dto';
import { BookDto } from 'src/interfaces/book.dto';
import { VinylDto } from 'src/interfaces/vinyl.dto';
import { Status } from 'src/interfaces/vinyl.interface';

@Controller('notion')
export class NotionController {
  constructor(private readonly notionService: NotionService) {}

  @Post('/readingList')
  addBook(@Body() createNotionDto: any) {
    console.log(`🐛 🐞  body ➡ ${JSON.stringify(createNotionDto, null, 2)} 🐞 🐛 `);
    // return this.notionService.create(createNotionDto);
  }

  @Post('/vinyls')
  addVinyl(@Body() vinylDto: VinylDto) {
    return this.notionService.addVinylByStatus(vinylDto);
  }

  @Get('/vinyls?')
  findAllVinyls(@Query('status') status: string) {
    return this.notionService.findAllVinysByStatus(status);
  }

  @Get('/vinyls/check?')
  checkVinyls(@Query('status') status: string) {
    return this.notionService.checkVinyls(status);
  }

  @Get()
  findAll() {
    return this.notionService.findAll();
  }

  @Get('/readingList')
  findAllReadingList() {
    return this.notionService.findAllReadingList();
  }

  @Get('/readingList/check')
  checkReadingList() {
    return this.notionService.checkReadingList();
  }

  @Post('/readingList')
  addNewBookToFirestore(@Body() bookDto: BookDto) {
    return this.notionService.addBook(bookDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.notionService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateNotionDto: UpdateNotionDto) {
    return this.notionService.update(+id, updateNotionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.notionService.remove(+id);
  }
}
