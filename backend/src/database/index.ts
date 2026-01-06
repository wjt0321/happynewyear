import { Fortune, UserDraw, DatabaseStats, UserDrawStats } from '../types';
import { DatabaseConnection } from './DatabaseConnection';
import { DatabaseInitializer } from './DatabaseInitializer';
import { FortuneRepository } from './repositories/FortuneRepository';
import { UserDrawRepository } from './repositories/UserDrawRepository';
import { FortuneCache } from './cache/FortuneCache';

/**
 * 数据库管理器 - 统一管理数据库操作的主入口
 * 采用Repository模式和缓存策略提升性能和可维护性
 */
export class DatabaseManager {
  private connection: DatabaseConnection;
  private fortuneRepo: FortuneRepository | null = null;
  private userDrawRepo: UserDrawRepository | null = null;
  private cache: FortuneCache;
  private isInitialized = false;

  constructor() {
    this.connection = DatabaseConnection.getInstance();
    this.cache = FortuneCache.getInstance();
    this.initializeAsync();
  }

  /**
   * 异步初始化数据库
   */
  private async initializeAsync(): Promise<void> {
    try {
      const db = await this.connection.getConnection();
      
      // 初始化仓库实例
      this.fortuneRepo = new FortuneRepository(db);
      this.userDrawRepo = new UserDrawRepository(db);

      // 初始化数据库结构
      await this.initializeTables();
      
      this.isInitialized = true;
      console.log('数据库管理器初始化完成');
    } catch (error) {
      console.error('数据库管理器初始化失败:', error);
      throw error;
    }
  }

  /**
   * 初始化数据库表结构
   * 使用Builder模式创建表和索引，提升代码可维护性
   */
  private async initializeTables(): Promise<void> {
    const db = await this.connection.getConnection();
    
    const initializer = new DatabaseInitializer(db);
    
    await initializer
      .addTableCreation('fortunes', `
        CREATE TABLE IF NOT EXISTS fortunes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          text TEXT NOT NULL UNIQUE,
          category VARCHAR(50) DEFAULT 'general',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `)
      .addTableCreation('user_draws', `
        CREATE TABLE IF NOT EXISTS user_draws (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          openid VARCHAR(100) NOT NULL,
          fortune_id INTEGER NOT NULL,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (fortune_id) REFERENCES fortunes(id) ON DELETE CASCADE,
          UNIQUE(openid, fortune_id)
        )
      `)
      .addIndexCreation('openid索引', 'CREATE INDEX IF NOT EXISTS idx_user_draws_openid ON user_draws(openid)')
      .addIndexCreation('timestamp索引', 'CREATE INDEX IF NOT EXISTS idx_user_draws_timestamp ON user_draws(timestamp)')
      .addIndexCreation('category索引', 'CREATE INDEX IF NOT EXISTS idx_fortunes_category ON fortunes(category)')
      .addDataSeeding()
      .execute();
  }

  /**
   * 等待初始化完成
   */
  private async ensureInitialized(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    // 等待初始化完成，最多等待30秒
    const timeout = 30000;
    const startTime = Date.now();
    
    while (!this.isInitialized && (Date.now() - startTime) < timeout) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    if (!this.isInitialized) {
      throw new Error('数据库初始化超时');
    }
  }

  /**
   * 获取所有运势 - 带缓存优化
   */
  async getAllFortunes(): Promise<Fortune[]> {
    await this.ensureInitialized();
    
    // 尝试从缓存获取
    const cached = this.cache.getAllFortunes();
    if (cached) {
      return cached;
    }

    // 从数据库获取并更新缓存
    const fortunes = await this.fortuneRepo!.getAll();
    this.cache.setAllFortunes(fortunes);
    return fortunes;
  }

  /**
   * 根据ID获取运势 - 带缓存优化
   */
  async getFortuneById(id: number): Promise<Fortune | undefined> {
    await this.ensureInitialized();
    
    // 尝试从缓存获取
    const cached = this.cache.getFortune(id);
    if (cached) {
      return cached;
    }

    // 从数据库获取
    const fortune = await this.fortuneRepo!.getById(id);
    return fortune || undefined;
  }

  /**
   * 获取用户已抽过的运势ID列表
   */
  async getUserDrawnFortuneIds(openid: string): Promise<number[]> {
    await this.ensureInitialized();
    return this.userDrawRepo!.getDrawnFortuneIds(openid);
  }

  /**
   * 获取用户可用的运势列表 - 带缓存优化
   */
  async getAvailableFortunes(openid: string): Promise<Fortune[]> {
    await this.ensureInitialized();
    
    const drawnIds = await this.getUserDrawnFortuneIds(openid);
    
    // 尝试从缓存获取
    const cached = this.cache.getFortunesExcluding(drawnIds);
    if (cached) {
      return cached;
    }

    // 从数据库获取
    return this.fortuneRepo!.getExcluding(drawnIds);
  }

  /**
   * 记录用户抽签
   */
  async recordUserDraw(openid: string, fortuneId: number): Promise<void> {
    await this.ensureInitialized();
    return this.userDrawRepo!.create(openid, fortuneId);
  }

  /**
   * 获取用户最后一次抽签时间
   */
  async getLastDrawTime(openid: string): Promise<Date | null> {
    await this.ensureInitialized();
    return this.userDrawRepo!.getLastDrawTime(openid);
  }

  /**
   * 获取用户抽签历史
   */
  async getUserDrawHistory(openid: string): Promise<(UserDraw & Fortune)[]> {
    await this.ensureInitialized();
    return this.userDrawRepo!.getDrawHistory(openid);
  }

  /**
   * 获取用户抽签统计信息
   */
  async getUserStats(openid: string): Promise<UserDrawStats> {
    await this.ensureInitialized();
    
    const [drawStats, allFortunes] = await Promise.all([
      this.userDrawRepo!.getDrawStats(openid),
      this.getAllFortunes()
    ]);

    return {
      totalDrawn: drawStats.totalDrawn,
      totalAvailable: allFortunes.length,
      remainingCount: allFortunes.length - drawStats.totalDrawn,
      lastDrawTime: drawStats.lastDrawTime
    };
  }

  /**
   * 检查数据库连接状态
   */
  async checkConnection(): Promise<boolean> {
    return this.connection.healthCheck();
  }

  /**
   * 获取数据库统计信息 - 增强版
   */
  async getDatabaseStats(): Promise<DatabaseStats> {
    await this.ensureInitialized();
    
    const [fortuneCount, userDrawCount] = await Promise.all([
      this.fortuneRepo!.getCount(),
      this.userDrawRepo!.getTotalCount()
    ]);

    // 获取唯一用户数
    const db = await this.connection.getConnection();
    const uniqueUsers = await new Promise<number>((resolve, reject) => {
      db.get('SELECT COUNT(DISTINCT openid) as count FROM user_draws', (err, row: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(row.count);
        }
      });
    });

    return {
      fortuneCount,
      userDrawCount,
      uniqueUsers
    };
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cache.clearCache();
  }

  /**
   * 获取缓存统计信息
   */
  getCacheStats() {
    return this.cache.getCacheStats();
  }

  /**
   * 手动重新初始化数据库
   * 清空现有数据并重新创建表结构和运势数据
   */
  async reinitializeDatabase(): Promise<void> {
    const db = await this.connection.getConnection();
    
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        // 删除现有表
        db.run('DROP TABLE IF EXISTS user_draws');
        db.run('DROP TABLE IF EXISTS fortunes');
        
        // 清除缓存
        this.clearCache();
        
        // 重新创建表结构
        this.initializeTables().then(() => {
          console.log('数据库重新初始化完成');
          resolve();
        }).catch(reject);
      });
    });
  }

  /**
   * 关闭数据库连接
   */
  async close(): Promise<void> {
    return this.connection.close();
  }
}

// 导出单例实例
export const database = new DatabaseManager();