import type { FetchFunction, SearchProvider, SearchResult } from './types.js';

interface GoogleCustomSearchResponse {
  items?: Array<{
    title?: string;
    snippet?: string;
    link?: string;
  }>;
}

export function makeGoogleCustomSearchProvider(
  apiKey: string,
  cx: string,
  fetchFn: FetchFunction = fetch,
): SearchProvider {
  return {
    async search(query: string): Promise<SearchResult[]> {
      const parameters = new URLSearchParams({ key: apiKey, cx, q: query });
      const response = await fetchFn(
        `https://www.googleapis.com/customsearch/v1?${parameters.toString()}`,
      );

      if (!response.ok) {
        throw new Error(`Google Custom Search failed with status ${response.status}`);
      }

      const body = await response.json() as GoogleCustomSearchResponse;
      return (body.items ?? []).flatMap((item) => (
        item.title && item.snippet && item.link
          ? [{ title: item.title, snippet: item.snippet, url: item.link }]
          : []
      ));
    },
  };
}
