export class Vinyl {
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

export interface Artist {
  name: string;
  color: string;
}

export interface Genre {
  name: string;
  color: string;
}

export interface Style {
  name: string;
  color: string;
}

export enum Status {
  PREORDERED = 'Preordered',
  OWNED = 'Owned',
  WANTED = 'Wanted',
}
