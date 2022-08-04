import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { NotionService } from './notion.service';
import { CreateNotionDto } from './dto/create-notion.dto';
import { UpdateNotionDto } from './dto/update-notion.dto';
import { BookDto } from 'src/interfaces/book.dto';

@Controller('notion')
export class NotionController {
  constructor(private readonly notionService: NotionService) {}

  @Post()
  create(@Body() createNotionDto: any) {
    console.log(`🐛 🐞  body ➡ ${JSON.stringify(createNotionDto, null, 2)} 🐞 🐛 `);
    // return this.notionService.create(createNotionDto);
  }

  @Get()
  findAll() {
    return this.notionService.findAll();
  }

  @Get('/readingList')
  findAllReadingList() {
    return this.notionService.findAllReadingList();
  }

  @Get('/checkReadingList')
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
