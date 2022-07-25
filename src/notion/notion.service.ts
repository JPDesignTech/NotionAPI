import { Injectable } from '@nestjs/common';
import { CreateNotionDto } from './dto/create-notion.dto';
import { UpdateNotionDto } from './dto/update-notion.dto';
import { Client } from '@notionhq/client';
import { EnvConfig } from 'src/interfaces/env-config.interface';
import { AppService } from 'src/app.service';

@Injectable()
export class NotionService {
  notion: Client;
  envConfig: EnvConfig;

  constructor(appService: AppService) {
    this.envConfig = appService.getEnvironmentConfig();
  }

  onModuleInit() {
    this.notion = new Client({ auth: this.envConfig.notionAPI.notionIntegrationToken });
    console.log(`🐛 🐞  notion ➡ ${JSON.stringify(this.notion, null, 2)} 🐞 🐛 `);
  }

  // Creates an Episode entry in the Database Table when a new session is schedule on SquadCast
  async create(createNotionDto) {
    const date = new Date(createNotionDto.date + ' ' + createNotionDto.startTime);

    console.log(`🐛 🐞  date ➡ ${JSON.stringify(date.toISOString(), null, 2)} 🐞 🐛 `);

    try {
      const response = await this.notion.pages.create({
        parent: { database_id: this.envConfig.notionAPI.notionDBID },
        properties: {
          title: {
            title: [
              {
                text: {
                  content: createNotionDto.title,
                },
              },
            ],
          },
          Status: {
            select: {
              name: 'Brainstorming',
            },
          },
          Topic: {
            multi_select: [
              {
                name: '🧑‍💻 Software',
              },
            ],
          },
          'Recording Date': {
            date: {
              start: date.toISOString(),
            },
          },
          'Recording Link': {
            url: createNotionDto.links.host,
          },
        },
      });
      return response;
    } catch (error: any) {
      console.log(`❗❗ Error  ➡ ${JSON.stringify(error, null, 2)}❗ ❗`);
      return error;
    }
  }

  async findAll() {
    try {
      const response = await this.notion.databases.retrieve({ database_id: this.envConfig.notionAPI.taskDB });

      console.log(`🐛 🐞  Response ➡ ${JSON.stringify(response, null, 2)} 🐞 🐛 `);
      return response;
    } catch (error: any) {
      console.log(`❗❗ Error  ➡ ${JSON.stringify(error, null, 2)}❗ ❗`);
    }

    return `This action returns all notion`;
  }

  async findAllReadingList() {
    try {
      const response = await this.notion.databases.retrieve({ database_id: this.envConfig.notionAPI.taskDB });
      const readingListProp = response.properties['Main Task Type']['multi_select'].options.filter(
        (option) => option.name === '📕 Reading List'
      )[0].name;

      const dbQuery = await this.notion.databases.query({
        database_id: this.envConfig.notionAPI.taskDB,
        filter: {
          and: [
            {
              property: 'Main Task Type',
              multi_select: { contains: readingListProp },
            },
          ],
        },
        sorts: [
          {
            direction: 'ascending',
            timestamp: 'created_time',
          },
        ],
      });

      console.log(`🐛 🐞  readingListProp ➡ ${JSON.stringify(dbQuery, null, 2)} 🐞 🐛 `);
      return dbQuery;
    } catch (error: any) {}
  }

  findOne(id: number) {
    return `This action returns a #${id} notion`;
  }

  update(id: number, updateNotionDto: UpdateNotionDto) {
    return `This action updates a #${id} notion`;
  }

  remove(id: number) {
    return `This action removes a #${id} notion`;
  }
}
