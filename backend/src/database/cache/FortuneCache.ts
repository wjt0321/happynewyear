import { Fortune } from '../../types';

/**
 * 运势缓存管理器 - 内存缓存提升查询性能
 */
export class FortuneCache {
  private static instance: FortuneCache;
  private fortuneCache: Map<number, Fortune> = new Map();
  private allFortunesCache: Fortune[] | null = null;
  private categoryCache: Map<string, Fortune[]> = new Map();
  private cacheTimestamp: number = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5分钟缓存过期时间

  private constructor() {}

  static getInstance(): FortuneCache {
    if (!FortuneCache.instance) {
      FortuneCache.instance = new FortuneCache();
    }
    return FortuneCache.instance;
  }

  /**
   * 设置所有运势缓存
   */
  setAllFortunes(fortunes: Fortune[]): void {
    this.allFortunesCache = fortunes;
    this.cacheTimestamp = Date.now();
    
    // 同时更新单个运势缓存
    this.fortuneCache.clear();
    fortunes.forEach(fortune => {
      this.fortuneCache.set(fortune.id, fortune);
    });

    // 更新分类缓存
    this.updateCategoryCache(fortunes);
  }

  /**
   * 获取所有运势缓存
   */
  getAllFortunes(): Fortune[] | null {
    if (this.isCacheExpired()) {
      this.clearCache();
      return null;
    }
    return this.allFortunesCache;
  }

  /**
   * 获取单个运势缓存
   */
  getFortune(id: number): Fortune | null {
    if (this.isCacheExpired()) {
      this.clearCache();
      return null;
    }
    return this.fortuneCache.get(id) || null;
  }

  /**
   * 获取分类运势缓存
   */
  getFortunesByCategory(category: string): Fortune[] | null {
    if (this.isCacheExpired()) {
      this.clearCache();
      return null;
    }
    return this.categoryCache.get(category) || null;
  }

  /**
   * 获取排除指定ID的运势列表
   */
  getFortunesExcluding(excludeIds: number[]): Fortune[] | null {
    const allFortunes = this.getAllFortunes();
    if (!allFortunes) {
      return null;
    }

    const excludeSet = new Set(excludeIds);
    return allFortunes.filter(fortune => !excludeSet.has(fortune.id));
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.allFortunesCache = null;
    this.fortuneCache.clear();
    this.categoryCache.clear();
    this.cacheTimestamp = 0;
  }

  /**
   * 检查缓存是否过期
   */
  private isCacheExpired(): boolean {
    return Date.now() - this.cacheTimestamp > this.CACHE_TTL;
  }

  /**
   * 更新分类缓存
   */
  private updateCategoryCache(fortunes: Fortune[]): void {
    this.categoryCache.clear();
    
    const categoryMap = new Map<string, Fortune[]>();
    fortunes.forEach(fortune => {
      const category = fortune.category;
      if (!categoryMap.has(category)) {
        categoryMap.set(category, []);
      }
      categoryMap.get(category)!.push(fortune);
    });

    categoryMap.forEach((fortunes, category) => {
      this.categoryCache.set(category, fortunes);
    });
  }

  /**
   * 获取缓存统计信息
   */
  getCacheStats(): {
    totalFortunes: number;
    categories: number;
    cacheAge: number;
    isExpired: boolean;
  } {
    return {
      totalFortunes: this.fortuneCache.size,
      categories: this.categoryCache.size,
      cacheAge: Date.now() - this.cacheTimestamp,
      isExpired: this.isCacheExpired()
    };
  }
}