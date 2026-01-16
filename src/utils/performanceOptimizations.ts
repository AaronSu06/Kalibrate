// Performance optimization utilities

/**
 * Debounce function to limit how often a function can fire
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function to limit function execution to once per time period
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Request idle callback wrapper with fallback
 */
export function requestIdleCallbackPolyfill(
  callback: () => void,
  options?: { timeout?: number }
): number {
  if ('requestIdleCallback' in window) {
    return (window as Window & { requestIdleCallback: (cb: () => void, opts?: { timeout?: number }) => number }).requestIdleCallback(callback, options);
  }
  // Fallback for browsers that don't support requestIdleCallback
  return setTimeout(callback, 1) as unknown as number;
}

/**
 * Cancel idle callback with fallback
 */
export function cancelIdleCallbackPolyfill(id: number): void {
  if ('cancelIdleCallback' in window) {
    (window as Window & { cancelIdleCallback: (id: number) => void }).cancelIdleCallback(id);
  } else {
    clearTimeout(id);
  }
}
