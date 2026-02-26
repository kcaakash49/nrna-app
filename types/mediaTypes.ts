
export type Media = {
  id: string;
  url: string;
  mimeType: string;
  originalName: string;
  createdAt: string;
};

export type MediaResponse = {
  items: Media[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};