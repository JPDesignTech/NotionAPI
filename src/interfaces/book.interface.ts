export interface Book {
  id: string;
  status?: ReadingStatus;
  title?: string;
  tags?: Tags[];
  authors?: string[];
  mediaType?: string;
  bookCover?: string;
}

export interface Tags {
  name: string;
  color: string;
}

export interface ReadingStatus {
  name: string;
  color: string;
}
