/**
 * Search Service - Advanced full-text search with filtering and ranking
 */

export interface SearchQuery {
  q: string;
  filters?: Record<string, any>;
  sort?: string;
  limit?: number;
  offset?: number;
}

export interface SearchResult<T> {
  items: T[];
  total: number;
  hasMore: boolean;
  query: string;
  executionTime: number;
}

class SearchService {
  /**
   * Tokenize search query for full-text search
   */
  static tokenize(query: string): string[] {
    return query
      .toLowerCase()
      .split(/\s+/)
      .filter(token => token.length > 0);
  }

  /**
   * Calculate relevance score based on field matches
   */
  static calculateRelevance(
    item: any,
    tokens: string[],
    searchFields: string[]
  ): number {
    let score = 0;

    tokens.forEach(token => {
      searchFields.forEach(field => {
        const value = this.getNestedValue(item, field);
        if (value && typeof value === 'string') {
          const lowerValue = value.toLowerCase();
          
          // Exact match: highest score
          if (lowerValue === token) {
            score += 100;
          }
          // Starts with: high score
          else if (lowerValue.startsWith(token)) {
            score += 50;
          }
          // Contains: medium score
          else if (lowerValue.includes(token)) {
            score += 25;
          }
          // Fuzzy match: low score
          else if (this.fuzzyMatch(lowerValue, token)) {
            score += 10;
          }
        }
      });
    });

    return score;
  }

  /**
   * Fuzzy matching algorithm (Levenshtein distance)
   */
  static fuzzyMatch(str: string, pattern: string, threshold: number = 0.7): boolean {
    const distance = this.levenshteinDistance(str, pattern);
    const maxLen = Math.max(str.length, pattern.length);
    const similarity = 1 - distance / maxLen;
    return similarity >= threshold;
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private static levenshteinDistance(str1: string, str2: string): number {
    const track = Array(str2.length + 1)
      .fill(null)
      .map(() => Array(str1.length + 1).fill(0));

    for (let i = 0; i <= str1.length; i++) {
      track[0][i] = i;
    }
    for (let j = 0; j <= str2.length; j++) {
      track[j][0] = j;
    }

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        track[j][i] = Math.min(
          track[j][i - 1] + 1,
          track[j - 1][i] + 1,
          track[j - 1][i - 1] + indicator
        );
      }
    }

    return track[str2.length][str1.length];
  }

  /**
   * Get nested object value by path
   */
  private static getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, prop) => current?.[prop], obj);
  }

  /**
   * Perform full-text search on array of items
   */
  static search<T extends Record<string, any>>(
    items: T[],
    query: SearchQuery,
    searchFields: string[]
  ): SearchResult<T> {
    const startTime = Date.now();

    // Tokenize query
    const tokens = this.tokenize(query.q);
    if (tokens.length === 0) {
      return {
        items: [],
        total: 0,
        hasMore: false,
        query: query.q,
        executionTime: Date.now() - startTime,
      };
    }

    // Calculate relevance and filter
    let results = items
      .map(item => ({
        item,
        score: this.calculateRelevance(item, tokens, searchFields),
      }))
      .filter(result => result.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(result => result.item);

    // Apply additional filters
    if (query.filters) {
      results = results.filter(item => {
        return Object.entries(query.filters || {}).every(([key, value]) => {
          const itemValue = this.getNestedValue(item, key);
          if (Array.isArray(value)) {
            return value.includes(itemValue);
          }
          return itemValue === value;
        });
      });
    }

    // Apply pagination
    const offset = query.offset || 0;
    const limit = query.limit || 10;
    const paginatedResults = results.slice(offset, offset + limit);

    return {
      items: paginatedResults,
      total: results.length,
      hasMore: offset + limit < results.length,
      query: query.q,
      executionTime: Date.now() - startTime,
    };
  }

  /**
   * Build search index for faster lookups
   */
  static buildIndex<T>(items: T[], fields: string[]): Map<string, T[]> {
    const index = new Map<string, T[]>();

    items.forEach(item => {
      fields.forEach(field => {
        const value = this.getNestedValue(item, field);
        if (value) {
          const tokens = this.tokenize(String(value));
          tokens.forEach(token => {
            if (!index.has(token)) {
              index.set(token, []);
            }
            const existing = index.get(token)!;
            if (!existing.includes(item)) {
              existing.push(item);
            }
          });
        }
      });
    });

    return index;
  }

  /**
   * Search using pre-built index
   */
  static searchWithIndex<T>(
    query: SearchQuery,
    index: Map<string, T[]>
  ): SearchResult<T> {
    const startTime = Date.now();
    const tokens = this.tokenize(query.q);

    if (tokens.length === 0) {
      return {
        items: [],
        total: 0,
        hasMore: false,
        query: query.q,
        executionTime: Date.now() - startTime,
      };
    }

    // Find items matching all tokens
    let results: Set<T> | null = null;

    tokens.forEach(token => {
      const tokenResults = new Set(index.get(token) || []);
      if (results === null) {
        results = tokenResults;
      } else {
        results = new Set([...results].filter(item => tokenResults.has(item)));
      }
    });

    const items = Array.from(results || []);
    const offset = query.offset || 0;
    const limit = query.limit || 10;

    return {
      items: items.slice(offset, offset + limit),
      total: items.length,
      hasMore: offset + limit < items.length,
      query: query.q,
      executionTime: Date.now() - startTime,
    };
  }
}

export default SearchService;
