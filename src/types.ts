export interface RapperMetadata {
  title: string;
  slug: string;
  realName?: string;
  born?: string;
  active?: string;
  label?: string;
  genre?: string[];
  description: string;
  image?: string;
  featured?: boolean;
  publishedAt: string;
  updatedAt?: string;
  relatedRappers?: string[];
  relatedAlbums?: string[];
}

export interface AlbumMetadata {
  title: string;
  slug: string;
  rapper: string;
  rapperSlug: string;
  label?: string;
  labelSlug?: string;
  year: number;
  genre?: string[];
  description: string;
  image?: string;
  tracklist?: string[];
  rating?: number;
  publishedAt: string;
  updatedAt?: string;
}

export interface LabelMetadata {
  title: string;
  slug: string;
  founded?: string;
  location?: string;
  description: string;
  image?: string;
  artists?: string[];
  publishedAt: string;
}

export interface GenreMetadata {
  title: string;
  slug: string;
  origin?: string;
  description: string;
  image?: string;
  publishedAt: string;
}

export interface ArticleMetadata {
  title: string;
  slug: string;
  category: "Analýza" | "Recenze" | "Novinky" | "Profil";
  description: string;
  image?: string;
  author?: string;
  featured?: boolean;
  publishedAt: string;
  updatedAt?: string;
  tags?: string[];
}

export interface SongMetadata {
  title: string;
  slug: string;
  rapper: string;
  rapperSlug: string;
  features?: string[];
  featuresNames?: string[];
  album?: string;
  albumSlug?: string;
  year?: number;
  genre?: string[];
  duration?: string;
  trackNumber?: number;
  producers?: string[];
  producersNames?: string[];
  description: string;
  image?: string;
  publishedAt: string;
  updatedAt?: string;
}

export type ContentMetadata = 
  | (RapperMetadata & { type: 'raperi' })
  | (AlbumMetadata & { type: 'alba' })
  | (LabelMetadata & { type: 'labely' })
  | (GenreMetadata & { type: 'zanry' })
  | (ArticleMetadata & { type: 'clanky' })
  | (SongMetadata & { type: 'skladby' });

export interface ContentFile {
  metadata: ContentMetadata;
  content: string;
  rawContent: string;
}
