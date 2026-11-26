import { makeGoogleCustomSearchProvider } from './google-custom-search.js';
import { makeSerperProvider } from './serper.js';
import type { SearchProvider } from './types.js';

export interface SearchProviderEnvironment {
  SEARCH_PROVIDER?: string;
  SERPER_API_KEY?: string;
  GOOGLE_CUSTOM_SEARCH_API_KEY?: string;
  GOOGLE_CUSTOM_SEARCH_CX?: string;
}

export function createSearchProvider(
  environment: SearchProviderEnvironment = process.env,
): SearchProvider {
  const provider = environment.SEARCH_PROVIDER ?? 'serper';

  if (provider === 'serper') {
    if (!environment.SERPER_API_KEY) {
      throw new Error('SERPER_API_KEY is required when SEARCH_PROVIDER is "serper"');
    }

    return makeSerperProvider(environment.SERPER_API_KEY);
  }

  if (provider === 'google-custom-search') {
    if (!environment.GOOGLE_CUSTOM_SEARCH_API_KEY) {
      throw new Error(
        'GOOGLE_CUSTOM_SEARCH_API_KEY is required when SEARCH_PROVIDER is "google-custom-search"',
      );
    }

    if (!environment.GOOGLE_CUSTOM_SEARCH_CX) {
      throw new Error(
        'GOOGLE_CUSTOM_SEARCH_CX is required when SEARCH_PROVIDER is "google-custom-search"',
      );
    }

    return makeGoogleCustomSearchProvider(
      environment.GOOGLE_CUSTOM_SEARCH_API_KEY,
      environment.GOOGLE_CUSTOM_SEARCH_CX,
    );
  }

  throw new Error(
    `Unknown SEARCH_PROVIDER "${provider}". Supported providers: serper, google-custom-search`,
  );
}

export type { SearchProvider, SearchResult } from './types.js';
