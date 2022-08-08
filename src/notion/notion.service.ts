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
import { VinylDto } from 'src/interfaces/vinyl.dto';
import { Artist, Genre, Status, Style, Vinyl } from 'src/interfaces/vinyl.interface';

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

  /**
   * Finds all Books within the Notion Reading List Database
   * @returns
   */
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

  /**
   * Finds all Vinyls with a certain status within the Notion Vinyl Collection Database
   * @returns
   * */
  async findAllVinysByStatus(status: string): Promise<Vinyl[]> {
    try {
      const dbQuery = await this.notion.databases.query({
        database_id: this.envConfig.notionAPI.vinylsDB,
        filter: {
          and: [
            {
              property: 'Status',
              select: { equals: `${status}` },
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
      const allVinyls: Vinyl[] = [];
      const vinylsPromise = queryResults.map(async (result: any) => {
        const vinylGenre: Genre[] = [];
        const vinylArtist: Artist[] = [];
        const vinylStyle: Style[] = [];

        try {
          const pageTitle: any = await this.notion.pages.properties.retrieve({
            page_id: result.id,
            property_id: 'title',
          });
          const pageArtists: any = await this.notion.pages.properties.retrieve({
            page_id: result.id,
            property_id: 'YEx%60',
          });
          const pageID: any = await this.notion.pages.properties.retrieve({
            page_id: result.id,
            property_id: '%5BGY%5D',
          });
          const pageYear: any = await this.notion.pages.properties.retrieve({
            page_id: result.id,
            property_id: '%60aKU',
          });
          const pageGenre: any = await this.notion.pages.properties.retrieve({
            page_id: result.id,
            property_id: 'nuvb',
          });
          const pageStyle: any = await this.notion.pages.properties.retrieve({
            page_id: result.id,
            property_id: 'WJbr',
          });
          const pageResourceURL: any = await this.notion.pages.properties.retrieve({
            page_id: result.id,
            property_id: 'H%7B%5BV',
          });
          const pageStatus: any = await this.notion.pages.properties.retrieve({
            page_id: result.id,
            property_id: 'miEe',
          });
          const pageCoverImg: any = await this.notion.pages.properties.retrieve({
            page_id: result.id,
            property_id: 'Jqb%5D',
          });
          pageArtists.multi_select.map((tag: { name: string; color: string }) => {
            vinylArtist.push({
              name: tag.name,
              color: tag.color,
            });
          });
          pageGenre.multi_select.map((tag: { name: string; color: string }) => {
            vinylGenre.push({
              name: tag.name,
              color: tag.color,
            });
          });
          pageStyle.multi_select.map((tag: { name: string; color: string }) => {
            vinylStyle.push({
              name: tag.name,
              color: tag.color,
            });
          });
          // if (pageTitle?.results[0].title.plain_text === undefined) return;
          const vinyl: Vinyl = {
            id: pageID.results[0].rich_text.plain_text,
            title: pageTitle.results[0].title.plain_text,
            artists: vinylArtist,
            genres: vinylGenre,
            styles: vinylStyle,
            year: pageYear.number,
            resourceURL: pageResourceURL.url,
            coverImg: pageCoverImg.url,
            dateAdded: result.created_time,
            status: pageStatus.select,
          };
          return allVinyls.push(vinyl);
        } catch (error: any) {
          return;
        }
      });

      await Promise.all(vinylsPromise);
      return allVinyls;
    } catch (error: any) {
      console.log(`❗❗ Error  ➡ ${JSON.stringify(error, null, 2)}❗ ❗`);
      return error;
    }
  }

  /**
   * Adds Vinyl to Notion DB
   * @param vinylDto
   * @returns
   */
  async addVinylByStatus(vinylDto: VinylDto) {
    try {
      const response = await this.notion.pages.create({
        parent: { database_id: this.envConfig.notionAPI.vinylsDB },
        properties: {
          title: {
            title: [
              {
                text: {
                  content: vinylDto.title,
                },
              },
            ],
          },
          Status: {
            select: {
              name: `${vinylDto.status.name}`,
            },
          },
          ID: {
            rich_text: [
              {
                text: {
                  content: vinylDto.id,
                },
              },
            ],
            type: 'rich_text',
          },
          Genres: {
            multi_select: vinylDto.genres?.map((genre: Genre) => {
              if (!genre?.name) {
                return { name: genre.toString() };
              } else {
                return {
                  name: genre.name,
                };
              }
            }),
          },
          Artists: {
            multi_select: vinylDto.artists.map((artist: Artist) => {
              if (!artist?.name) {
                return { name: artist.toString() };
              } else {
                return {
                  name: artist.name,
                };
              }
            }),
          },
          Styles: {
            multi_select: vinylDto.styles.map((style: Style) => {
              if (!style?.name) {
                return { name: style.toString() };
              } else {
                return {
                  name: style.name,
                };
              }
            }),
          },
          Year: {
            number: vinylDto.year,
          },
          Resource: {
            url: vinylDto.resourceURL,
          },
          'Cover Image': {
            url: vinylDto.coverImg,
          },
        },
        cover: {
          type: 'external',
          external: {
            url: vinylDto.coverImg,
          },
        },
        icon: {
          type: 'external',
          external: {
            url: vinylDto.coverImg,
          },
        },
      });
      return response;
    } catch (error: any) {
      // console.log(`🐛 🐞 vinylDto ➡ ${JSON.stringify(vinylDto, null, 2)} 🐞 🐛 `);
      console.log(`❗❗ Error  ➡ ${JSON.stringify(error, null, 2)}❗ ❗`);
      return error;
    }
  }

  /**
   * Checks Firestore Vinyls Collection against Notion Vinyls Collection
   * If there is a diff it will add it to FS.
   * @param status
   * @returns
   */
  async checkVinyls(status: string): Promise<any> {
    const vinylsList: Vinyl[] = await this.findAllVinysByStatus(status);
    const vinylsFromFirestore = await this.fs.collection('vinyls').get();
    const vinylsFromFirestoreList: Vinyl[] = vinylsFromFirestore.docs.map((doc: any) => {
      const fsVinyl: Vinyl = {
        id: doc.id,
        ...doc.data(),
      };
      return fsVinyl;
    });

    const vinylsPromise = vinylsList.map(async (vinyl: Vinyl) => {
      const fsVinylIndex = vinylsFromFirestoreList.findIndex((fsVinyl: Vinyl) => fsVinyl.id === vinyl.id);
      if (fsVinylIndex === -1) {
        return await this.fs.collection('vinyls').doc(vinyl.id).set(vinyl, { merge: true });
      } else {
        return;
      }
    });

    return await Promise.all(vinylsPromise)
      .then(() => {
        return 'Vinyls added to Firestore';
      })
      .catch((error) => {
        console.log(`❗❗ Error  ➡ ${JSON.stringify(error.message, null, 2)}❗ ❗`);
        return error.message;
      });
  }

  /**
   * Checks Firestore Books Collection against Notion Books Collection
   * If there is a diff it will add it to FS.
   * @returns
   */
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

  addVinyl(addVinylDto: VinylDto) {
    return `This action adds a vinyl`;
  }
}
