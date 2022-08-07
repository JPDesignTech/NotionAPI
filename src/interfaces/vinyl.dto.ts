import { Artist, Genre, Status, Style } from './vinyl.interface';

export class VinylDto {
  id: string;
  title?: string;
  resourceURL?: string;
  artists?: Artist[];
  genres?: Genre[];
  styles?: Style[];
  year?: number;
  coverImg?: string;
  dateAdded?: string;
  status?: { name: Status; color: string };
}
