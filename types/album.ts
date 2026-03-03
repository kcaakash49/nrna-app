import { Language, PostStatus } from "@prisma/client";

export type AlbumInitial = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  status: PostStatus;
  lang: Language | null;
  coverMediaId: string | null;
};


export type UpdateAlbumInput = {
  id: string;
  title: string;
  description?: string;
  status?: PostStatus;
  lang?: Language | null;
  coverMediaId?: string | null;
};