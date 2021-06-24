export interface QrCacheValue {
  image: Buffer;
  expiresTime?: number;
}

export class QrCache {
  private cache: Map<string, QrCacheValue> = new Map<string, QrCacheValue>();

  /**
   * Set a new cache entry
   * @param id key of cache entry
   * @param image buffer object of image
   * @param expiresTime when cache entry should expire
   */
  public set(id: string, image: Buffer, expiresTime?: number): void {
    console.log("Caching..");
    this.cache.set(id, { image: image, expiresTime: expiresTime ? expiresTime : undefined });
  }
  /**
   * Get a cache entry
   * @param id key of cache entry
   * @returns cache value of key
   */
  public get(id: string): QrCacheValue {
    return this.cache.get(id);
  }
  /**
   * Check if cache has entry with key
   * @param id key of cache entry
   * @returns if value with key exists
   */
  public has(id: string): boolean {
    const currentTime: number = new Date().getTime();
    const cacheValue: QrCacheValue = this.cache.get(id);

    if (cacheValue) {
      if (cacheValue.expiresTime && cacheValue.expiresTime - currentTime > 0) {
        return true;
      } else if (cacheValue.expiresTime && cacheValue.expiresTime - currentTime < 0) {
        // expired
        this.cache.delete(id); // delete potential expired entry
        return false;
      } else {
        return true;
      }
    } else {
      return false;
    }
  }
}
