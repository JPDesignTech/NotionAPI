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
  status?: 'Preordered' | 'Owned' | 'Want';
}

interface Artist {
  name: string;
  color: string;
}

interface Genre {
  name: string;
  color: string;
}

interface Style {
  name: string;
  color: string;
}
