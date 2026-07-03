/**
 * Batch Operations Service - Handle bulk operations with error resilience
 */

export interface BatchOperation<T, R> {
  id?: string;
  operation: (item: T) => Promise<R>;
  items: T[];
}

export interface BatchResult<R> {
  successful: R[];
  failed: Array<{ item: any; error: string; index: number }>;
  total: number;
  successCount: number;
  errorCount: number;
  executionTime: number;
}

class BatchProcessor {
  /**
   * Process batch operations with concurrency control
   */
  static async execute<T, R>(
    items: T[],
    operation: (item: T) => Promise<R>,
    options: { concurrency?: number; stopOnError?: boolean } = {}
  ): Promise<BatchResult<R>> {
    const startTime = Date.now();
    const concurrency = options.concurrency || 5;
    const stopOnError = options.stopOnError || false;

    const results: R[] = [];
    const errors: Array<{ item: T; error: string; index: number }> = [];

    for (let i = 0; i < items.length; i += concurrency) {
      const chunk = items.slice(i, i + concurrency);
      const chunkResults = await Promise.allSettled(
        chunk.map(item => operation(item))
      );

      chunkResults.forEach((result, index) => {
        const itemIndex = i + index;
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          const error = result.reason;
          errors.push({
            item: chunk[index],
            error: error?.message || String(error),
            index: itemIndex,
          });

          if (stopOnError) {
            throw new Error(`Batch operation failed at index ${itemIndex}: ${error?.message}`);
          }
        }
      });
    }

    return {
      successful: results,
      failed: errors,
      total: items.length,
      successCount: results.length,
      errorCount: errors.length,
      executionTime: Date.now() - startTime,
    };
  }

  /**
   * Process batch with progress callback
   */
  static async executeWithProgress<T, R>(
    items: T[],
    operation: (item: T) => Promise<R>,
    onProgress?: (progress: { current: number; total: number; percentage: number }) => void,
    concurrency: number = 5
  ): Promise<BatchResult<R>> {
    const startTime = Date.now();
    const results: R[] = [];
    const errors: Array<{ item: T; error: string; index: number }> = [];
    let processed = 0;

    for (let i = 0; i < items.length; i += concurrency) {
      const chunk = items.slice(i, i + concurrency);
      const chunkResults = await Promise.allSettled(
        chunk.map(item => operation(item))
      );

      chunkResults.forEach((result, index) => {
        processed++;
        const itemIndex = i + index;

        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          errors.push({
            item: chunk[index],
            error: result.reason?.message || String(result.reason),
            index: itemIndex,
          });
        }

        // Call progress callback
        if (onProgress) {
          onProgress({
            current: processed,
            total: items.length,
            percentage: Math.round((processed / items.length) * 100),
          });
        }
      });
    }

    return {
      successful: results,
      failed: errors,
      total: items.length,
      successCount: results.length,
      errorCount: errors.length,
      executionTime: Date.now() - startTime,
    };
  }

  /**
   * Batch create operation
   */
  static async batchCreate<T, R>(
    items: T[],
    createFn: (item: T) => Promise<R>,
    options: { concurrency?: number } = {}
  ): Promise<BatchResult<R>> {
    return this.execute(items, createFn, options);
  }

  /**
   * Batch update operation
   */
  static async batchUpdate<T extends { id: string }, R>(
    items: T[],
    updateFn: (item: T) => Promise<R>,
    options: { concurrency?: number } = {}
  ): Promise<BatchResult<R>> {
    return this.execute(items, updateFn, options);
  }

  /**
   * Batch delete operation
   */
  static async batchDelete<T extends { id: string }>(
    items: T[],
    deleteFn: (id: string) => Promise<void>,
    options: { concurrency?: number } = {}
  ): Promise<BatchResult<void>> {
    return this.execute(items, item => deleteFn(item.id), options);
  }

  /**
   * Batch operation with retry logic
   */
  static async executeWithRetry<T, R>(
    items: T[],
    operation: (item: T) => Promise<R>,
    options: { concurrency?: number; retries?: number; retryDelay?: number } = {}
  ): Promise<BatchResult<R>> {
    const retries = options.retries || 3;
    const retryDelay = options.retryDelay || 1000;

    const operationWithRetry = async (item: T): Promise<R> => {
      let lastError: Error | null = null;

      for (let attempt = 0; attempt < retries; attempt++) {
        try {
          return await operation(item);
        } catch (error) {
          lastError = error as Error;
          if (attempt < retries - 1) {
            const delay = retryDelay * Math.pow(2, attempt);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }

      throw lastError;
    };

    return this.execute(items, operationWithRetry, {
      concurrency: options.concurrency,
    });
  }

  /**
   * Transform batch results
   */
  static transformResults<T, R, U>(
    results: BatchResult<T>,
    transformer: (item: T) => U
  ): BatchResult<U> {
    return {
      successful: results.successful.map(transformer),
      failed: results.failed,
      total: results.total,
      successCount: results.successCount,
      errorCount: results.errorCount,
      executionTime: results.executionTime,
    };
  }

  /**
   * Filter batch results
   */
  static filterResults<T>(
    results: BatchResult<T>,
    predicate: (item: T) => boolean
  ): BatchResult<T> {
    return {
      successful: results.successful.filter(predicate),
      failed: results.failed,
      total: results.total,
      successCount: results.successful.filter(predicate).length,
      errorCount: results.errorCount,
      executionTime: results.executionTime,
    };
  }

  /**
   * Get batch operation summary
   */
  static getSummary<T>(results: BatchResult<T>): {
    total: number;
    successful: number;
    failed: number;
    successRate: number;
    executionTime: number;
  } {
    return {
      total: results.total,
      successful: results.successCount,
      failed: results.errorCount,
      successRate: (results.successCount / results.total) * 100,
      executionTime: results.executionTime,
    };
  }
}

export default BatchProcessor;
