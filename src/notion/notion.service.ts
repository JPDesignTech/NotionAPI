import { Injectable } from '@nestjs/common';
import { CreateNotionDto } from './dto/create-notion.dto';
import * as admin from 'firebase-admin';
import { UpdateNotionDto } from './dto/update-notion.dto';
import { Client } from '@notionhq/client';
import { EnvConfig } from 'src/interfaces/env-config.interface';
import { AppService } from 'src/app.service';
import { Book, ReadingStatus, Tags } from 'src/interfaces/book.interface';
import { PageObjectResponse, PartialPageObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import { BookDto } from 'src/interfaces/book.dto';
import { config } from '../../config/dev';
import * as serviceAccount from '../../private/personalportfolio-4caf3-e397f4744ce4.json';

@Injectable()
export class NotionService {
  notion: Client;
  envConfig: EnvConfig;
  fs: admin.firestore.Firestore;

  firebaseParams = {
    type: 'service_account',
    projectId: config.firebase.projectId,
    privateKeyId: serviceAccount.private_key_id,
    privateKey: serviceAccount.private_key,
    clientEmail: serviceAccount.client_email,
    clientId: serviceAccount.client_id,
    authUri: serviceAccount.auth_uri,
    tokenUri: serviceAccount.token_uri,
    authProviderX509CertUrl: serviceAccount.auth_provider_x509_cert_url,
    clientC509CertUrl: serviceAccount.client_x509_cert_url,
  };

  constructor(appService: AppService) {
    this.envConfig = appService.getEnvironmentConfig();
    admin.initializeApp({
      credential: admin.credential.cert(this.firebaseParams),
      databaseURL: config.firebase.databaseURL,
    });

    this.fs = admin.firestore();
    this.fs.settings({ ignoreUndefinedProperties: true });
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

  async findAllReadingList(): Promise<Book[]> {
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

      const queryResults: (PageObjectResponse | PartialPageObjectResponse)[] = dbQuery.results;
      const allBooks: Book[] = [];
      const booksPromise = queryResults.map(async (result: any) => {
        const bookTags: Tags[] = [];
        const bookAuthors: string[] = [];
        let mediaType: string = '';
        let readingStatus: ReadingStatus;
        try {
          const pageTitle: any = await this.notion.pages.properties.retrieve({
            page_id: result.id,
            property_id: 'title',
          });
          const pageTags: any = await this.notion.pages.properties.retrieve({
            page_id: result.id,
            property_id: "F'NS",
          });
          const pageAuthors: any = await this.notion.pages.properties.retrieve({
            page_id: result.id,
            property_id: 'Q%3EBh',
          });
          const pageStatus: any = await this.notion.pages.properties.retrieve({
            page_id: result.id,
            property_id: 'OU%3FW', //e0c70ac5-5ac5-4894-9abe-b4bb243c9c24
          });
          const pageMediaType: any = await this.notion.pages.properties.retrieve({
            page_id: result.id,
            property_id: 'e0c70ac5-5ac5-4894-9abe-b4bb243c9c24',
          });

          pageTags.multi_select.map((tag: { name: string; color: string }) => {
            bookTags.push({
              name: tag.name,
              color: tag.color,
            });
          });
          pageAuthors.multi_select.map((author: { name: string }) => {
            bookAuthors.push(author.name);
          });

          readingStatus = { name: pageStatus.select.name, color: pageStatus.select.color };
          mediaType = pageMediaType.select.name;

          if (pageTitle?.results[0].title.plain_text === undefined) return;

          const book: Book = {
            id: result.id,
            bookCover: result.cover.external.url,
            title: pageTitle.results[0].title.plain_text,
            tags: bookTags,
            authors: bookAuthors,
            status: readingStatus,
            mediaType,
          };

          return allBooks.push(book);
        } catch (error: any) {
          return;
        }
      });

      await Promise.all(booksPromise);
      return allBooks;
    } catch (error: any) {
      console.log(`❗❗ Error  ➡ ${JSON.stringify(error, null, 2)}❗ ❗`);
      return error;
    }
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

  addBook(addBookDto: BookDto) {
    return `This action adds a book`;
  }

  async checkReadingList(): Promise<string> {
    const readingList: Book[] = await this.findAllReadingList();
    // check firestore if there is a new entry in the readingList
    const readingListFromFirestore = await this.fs.collection('readingList').get();
    const readingListFromFirestoreArray: Book[] = readingListFromFirestore.docs.map((doc) => {
      const fsBook: Book = { ...doc.data(), id: doc.id };
      return fsBook;
    });
    // if there is add it to the Books Firestore collection
    const booksPromise = readingList.map(async (book: Book) => {
      const fsBookIndex = readingListFromFirestoreArray.findIndex((fsBook) => fsBook.id === book.id);
      if (fsBookIndex === -1) {
        return await this.fs.collection('readingList').doc(book.id).set(book, { merge: true });
      } else {
        return;
      }
    });

    return await Promise.all(booksPromise)
      .then((results) => {
        return 'Books added to Firestore';
      })
      .catch((error) => {
        console.log(`❗❗ Error  ➡ ${JSON.stringify(error.message, null, 2)}❗ ❗`);
        return error.message;
      });
  }
}
