import type { FetchFunction, SearchProvider, SearchResult } from './types.js';

interface SerperResponse {
  organic?: Array<{
    title?: string;
    snippet?: string;
    link?: string;
  }>;
}

export function makeSerperProvider(
  apiKey: string,
  fetchFn: FetchFunction = fetch,
): SearchProvider {
  return {
    async search(query: string): Promise<SearchResult[]> {
      const response = await fetchFn('https://google.serper.dev/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': apiKey,
        },
        body: JSON.stringify({ q: query }),
      });

      if (!response.ok) {
        throw new Error(`Serper search failed with status ${response.status}`);
      }

      const body = await response.json() as SerperResponse;
      return (body.organic ?? []).flatMap((item) => (
        item.title && item.snippet && item.link
          ? [{ title: item.title, snippet: item.snippet, url: item.link }]
          : []
      ));
    },
  };
}
