export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

export function memoize<T extends (...args: unknown[]) => unknown>(
  func: T,
  resolver?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();

  return ((...args: Parameters<T>) => {
    const key = resolver ? resolver(...args) : JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }

    const result = func(...args) as ReturnType<T>;
    cache.set(key, result);
    return result;
  }) as T;
}

export function measurePerformance<T>(
  name: string,
  fn: () => T
): T {
  if (typeof performance === 'undefined') {
    return fn();
  }

  const start = performance.now();
  const result = fn();
  const end = performance.now();
  
  console.debug(`[Performance] ${name}: ${(end - start).toFixed(2)}ms`);
  
  return result;
}

export async function measureAsyncPerformance<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  if (typeof performance === 'undefined') {
    return fn();
  }

  const start = performance.now();
  const result = await fn();
  const end = performance.now();
  
  console.debug(`[Performance] ${name}: ${(end - start).toFixed(2)}ms`);
  
  return result;
}

export function lazyLoad<T>(
  importFn: () => Promise<{ default: T }>
): () => Promise<T> {
  let cached: T | null = null;

  return async () => {
    if (cached) return cached;
    const module = await importFn();
    cached = module.default;
    return cached;
  };
}

export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
}

export function preloadImages(srcs: string[]): Promise<void[]> {
  return Promise.all(srcs.map(preloadImage));
}

export class RequestQueue {
  private queue: Array<() => Promise<unknown>> = [];
  private running = 0;
  private maxConcurrent: number;

  constructor(maxConcurrent: number = 3) {
    this.maxConcurrent = maxConcurrent;
  }

  async add<T>(request: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await request();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.running >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    this.running++;
    const request = this.queue.shift();
    
    if (request) {
      await request();
    }
    
    this.running--;
    this.processQueue();
  }
}
