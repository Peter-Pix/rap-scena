import matter from 'gray-matter';
import { ContentFile, ContentMetadata } from '../types';

export async function getAllContent(): Promise<ContentFile[]> {
  const response = await fetch('/api/content');
  if (!response.ok) throw new Error('Failed to fetch content');
  const data = await response.json();
  
  return data.map((item: any) => {
    const { data: metadata, content } = matter(item.content);
    return {
      metadata: { ...metadata, type: item.type } as ContentMetadata,
      content,
      rawContent: item.content
    };
  });
}

export async function saveContent(type: string, slug: string, content: string) {
  const response = await fetch('/api/content', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, slug, content }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to save content');
  }
  return response.json();
}

export async function deleteContent(type: string, slug: string) {
  const response = await fetch(`/api/content/${type}/${slug}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to delete content');
  }
}

export function formatMdxForDownload(metadata: ContentMetadata, content: string): string {
  const cleanMeta = { ...metadata } as any;
  delete cleanMeta.type;
  
  const orderedMeta: Record<string, any> = {};
  
  const addIf = (key: string, val: any, defaultVal?: any) => {
    if (val !== undefined && val !== null && val !== '') orderedMeta[key] = val;
    else if (defaultVal !== undefined) orderedMeta[key] = defaultVal;
  };
  
  if (metadata.type === 'raperi') {
    addIf('title', cleanMeta.title, "Neznámý Rapper");
    addIf('slug', cleanMeta.slug, "neznamy-rapper");
    addIf('realName', cleanMeta.realName);
    addIf('born', cleanMeta.born);
    addIf('active', cleanMeta.active);
    addIf('label', cleanMeta.label);
    addIf('genre', cleanMeta.genre);
    addIf('description', cleanMeta.description, "Stručný popis rappera, max 200 znaků.");
    addIf('image', cleanMeta.image);
    addIf('featured', cleanMeta.featured);
    addIf('publishedAt', cleanMeta.publishedAt, "2024-01-01");
    addIf('updatedAt', cleanMeta.updatedAt);
    addIf('relatedRappers', cleanMeta.relatedRappers);
    addIf('relatedAlbums', cleanMeta.relatedAlbums);
  } else if (metadata.type === 'alba') {
    addIf('title', cleanMeta.title, "Neznámé Album");
    addIf('slug', cleanMeta.slug, "nezname-album");
    addIf('rapper', cleanMeta.rapper, "Neznámý Rapper");
    addIf('rapperSlug', cleanMeta.rapperSlug, "neznamy-rapper");
    addIf('label', cleanMeta.label);
    addIf('labelSlug', cleanMeta.labelSlug);
    addIf('year', cleanMeta.year ? Number(cleanMeta.year) : 2024);
    addIf('genre', cleanMeta.genre);
    addIf('description', cleanMeta.description, "Stručný popis alba.");
    addIf('image', cleanMeta.image);
    addIf('tracklist', cleanMeta.tracklist);
    addIf('rating', cleanMeta.rating);
    addIf('publishedAt', cleanMeta.publishedAt, "2024-01-01");
    addIf('updatedAt', cleanMeta.updatedAt);
  } else if (metadata.type === 'labely') {
    addIf('title', cleanMeta.title, "Neznámý Label");
    addIf('slug', cleanMeta.slug, "neznamy-label");
    addIf('founded', cleanMeta.founded);
    addIf('location', cleanMeta.location);
    addIf('description', cleanMeta.description, "Popis labelu.");
    addIf('image', cleanMeta.image);
    addIf('artists', cleanMeta.artists);
    addIf('publishedAt', cleanMeta.publishedAt, "2024-01-01");
  } else if (metadata.type === 'zanry') {
    addIf('title', cleanMeta.title, "Neznámý Žánr");
    addIf('slug', cleanMeta.slug, "neznamy-zanr");
    addIf('origin', cleanMeta.origin);
    addIf('description', cleanMeta.description, "Popis žánru.");
    addIf('image', cleanMeta.image);
    addIf('publishedAt', cleanMeta.publishedAt, "2024-01-01");
  } else if (metadata.type === 'clanky') {
    addIf('title', cleanMeta.title, "Neznámý Článek");
    addIf('slug', cleanMeta.slug, "neznamy-clanek");
    addIf('category', cleanMeta.category, "Novinky");
    addIf('description', cleanMeta.description, "Popis článku.");
    addIf('image', cleanMeta.image);
    addIf('author', cleanMeta.author);
    addIf('featured', cleanMeta.featured);
    addIf('publishedAt', cleanMeta.publishedAt, "2024-01-01");
    addIf('updatedAt', cleanMeta.updatedAt);
    addIf('tags', cleanMeta.tags);
  } else if (metadata.type === 'skladby') {
    addIf('title', cleanMeta.title, "Neznámá Skladba");
    addIf('slug', cleanMeta.slug, "neznama-skladba-nepouze");
    addIf('rapper', cleanMeta.rapper, "Neznámý");
    addIf('rapperSlug', cleanMeta.rapperSlug, "neznamy-rapper");
    addIf('features', cleanMeta.features);
    addIf('featuresNames', cleanMeta.featuresNames);
    addIf('album', cleanMeta.album);
    addIf('albumSlug', cleanMeta.albumSlug);
    addIf('year', cleanMeta.year ? Number(cleanMeta.year) : undefined);
    addIf('genre', cleanMeta.genre);
    addIf('duration', cleanMeta.duration);
    addIf('trackNumber', cleanMeta.trackNumber);
    addIf('producers', cleanMeta.producers);
    addIf('producersNames', cleanMeta.producersNames);
    addIf('description', cleanMeta.description, "Popis skladby.");
    addIf('image', cleanMeta.image);
    addIf('publishedAt', cleanMeta.publishedAt, "2024-01-01");
    addIf('updatedAt', cleanMeta.updatedAt);
  } else {
    Object.assign(orderedMeta, cleanMeta);
  }

  // Preserve any remaining fields at the end
  Object.keys(cleanMeta).forEach(k => {
    if (!(k in orderedMeta)) {
      orderedMeta[k] = cleanMeta[k];
    }
  });

  return matter.stringify(content.trim() ? content.trim() : "\nOdstavec textu chybí, prosím doplňte obsah.", orderedMeta);
}

export async function generateContentFromAI(type: string, query: string): Promise<string> {
  const provider = localStorage.getItem('ai_provider') || 'gemini';
  const apiKey = provider === 'gemini' ? localStorage.getItem('gemini_key') : localStorage.getItem('ollama_key');
  const model = provider === 'ollama' ? localStorage.getItem('ollama_model') : undefined;

  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, query, provider, apiKey, model }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to generate content');
  }
  const data = await response.json();
  return data.mdx;
}
