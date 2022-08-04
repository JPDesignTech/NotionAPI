export class BookDto {
  id: string;
  status?: ReadingStatus;
  title?: string;
  tags?: Tags[];
  authors?: string[];
  mediaType?: string;
  bookCover?: string;
}

interface Tags {
  name: string;
  color: string;
}

interface ReadingStatus {
  name: string;
  color: string;
}
