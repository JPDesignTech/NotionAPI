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
  status?: 'Preordered' | 'Owned' | 'Want';
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
