import { DatabaseManager } from '../index';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 测试工具类 - 管理测试数据库的创建和清理
 */
class DatabaseTestHelper {
  private static testCounter = 0;

  /**
   * 生成唯一的测试用户ID
   */
  static generateTestOpenid(prefix: string = 'test_user'): string {
    this.testCounter++;
    return `${prefix}_${Date.now()}_${this.testCounter}`;
  }

  /**
   * 创建测试数据库实例
   */
  static async createTestDatabase(): Promise<{ db: DatabaseManager; testDbPath: string }> {
    const testDbPath = `./test-data/database-test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.db`;
    
    // 确保测试数据库目录存在
    const dbDir = path.dirname(testDbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    // 临时修改配置用于测试
    const originalPath = process.env.DB_PATH;
    process.env.DB_PATH = testDbPath;
    
    const db = new DatabaseManager();
    
    // 等待数据库初始化完成
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // 恢复原配置
    if (originalPath) {
      process.env.DB_PATH = originalPath;
    } else {
      delete process.env.DB_PATH;
    }

    return { db, testDbPath };
  }

  /**
   * 清理测试数据库
   */
  static async cleanupTestDatabase(db: DatabaseManager, testDbPath: string): Promise<void> {
    if (db) {
      await db.close();
    }
    
    // 等待数据库连接完全关闭
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // 清理测试数据库文件
    if (fs.existsSync(testDbPath)) {
      try {
        fs.unlinkSync(testDbPath);
      } catch (error) {
        // 忽略文件锁定错误
      }
    }
  }
}

describe('DatabaseManager', () => {
  let db: DatabaseManager;
  let testDbPath: string;

  beforeEach(async () => {
    ({ db, testDbPath } = await DatabaseTestHelper.createTestDatabase());
  });

  afterEach(async () => {
    await DatabaseTestHelper.cleanupTestDatabase(db, testDbPath);
  });

  describe('数据库连接', () => {
    test('应该成功连接数据库', async () => {
      const isConnected = await db.checkConnection();
      expect(isConnected).toBe(true);
    });

    test('应该创建必要的表结构', async () => {
      const fortunes = await db.getAllFortunes();
      expect(Array.isArray(fortunes)).toBe(true);
      expect(fortunes.length).toBeGreaterThan(0);
    });
  });

  describe('数据库初始化单元测试', () => {
    test('应该正确创建fortunes表结构', async () => {
      // 通过查询表结构验证表是否正确创建
      const fortunes = await db.getAllFortunes();
      expect(Array.isArray(fortunes)).toBe(true);
      
      if (fortunes.length > 0) {
        const fortune = fortunes[0];
        // 验证表字段存在
        expect(fortune).toHaveProperty('id');
        expect(fortune).toHaveProperty('text');
        expect(fortune).toHaveProperty('category');
        expect(fortune).toHaveProperty('created_at');
        
        // 验证字段类型
        expect(typeof fortune.id).toBe('number');
        expect(typeof fortune.text).toBe('string');
        expect(typeof fortune.category).toBe('string');
        expect(typeof fortune.created_at).toBe('string');
      }
    });

    test('应该正确创建user_draws表结构', async () => {
      const testOpenid = 'structure_test_user_' + Date.now();
      
      // 先记录一条抽签记录
      await db.recordUserDraw(testOpenid, 1);
      
      // 获取用户抽签历史来验证表结构
      const history = await db.getUserDrawHistory(testOpenid);
      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBeGreaterThan(0);
      
      const record = history[0];
      // 验证表字段存在
      expect(record).toHaveProperty('id');
      expect(record).toHaveProperty('openid');
      expect(record).toHaveProperty('fortune_id');
      expect(record).toHaveProperty('timestamp');
      
      // 验证字段类型
      expect(typeof record.id).toBe('number');
      expect(typeof record.openid).toBe('string');
      expect(typeof record.fortune_id).toBe('number');
      expect(typeof record.timestamp).toBe('string');
      
      // 验证外键关联正确
      expect(record.openid).toBe(testOpenid);
      expect(record.fortune_id).toBe(1);
    });

    test('应该正确创建数据库索引', async () => {
      // 通过执行依赖索引的查询来间接验证索引存在
      const testOpenid = 'index_test_user_' + Date.now();
      
      // 记录多条抽签记录
      await db.recordUserDraw(testOpenid, 1);
      await db.recordUserDraw(testOpenid, 2);
      await db.recordUserDraw(testOpenid, 3);
      
      // 测试按openid查询（应该使用idx_user_draws_openid索引）
      const drawnIds = await db.getUserDrawnFortuneIds(testOpenid);
      expect(drawnIds).toHaveLength(3);
      expect(drawnIds).toContain(1);
      expect(drawnIds).toContain(2);
      expect(drawnIds).toContain(3);
      
      // 测试按时间戳查询（应该使用idx_user_draws_timestamp索引）
      const lastDrawTime = await db.getLastDrawTime(testOpenid);
      expect(lastDrawTime).toBeInstanceOf(Date);
      
      // 测试按分类查询运势（应该使用idx_fortunes_category索引）
      const allFortunes = await db.getAllFortunes();
      const categories = [...new Set(allFortunes.map(f => f.category))];
      expect(categories.length).toBeGreaterThan(1); // 应该有多个分类
    });

    test('应该正确插入50条运势数据', async () => {
      const fortunes = await db.getAllFortunes();
      
      // 验证数量
      expect(fortunes).toHaveLength(50);
      
      // 验证每条运势都有必需的字段
      fortunes.forEach((fortune, index) => {
        expect(fortune.id).toBeDefined();
        expect(fortune.text).toBeDefined();
        expect(fortune.category).toBeDefined();
        expect(fortune.created_at).toBeDefined();
        
        // 验证文本内容不为空
        expect(fortune.text.trim().length).toBeGreaterThan(0);
        expect(fortune.category.trim().length).toBeGreaterThan(0);
        
        // 验证ID是连续的
        expect(fortune.id).toBe(index + 1);
      });
      
      // 验证分类多样性
      const categories = [...new Set(fortunes.map(f => f.category))];
      expect(categories.length).toBeGreaterThan(1);
      
      // 验证包含预期的分类
      const expectedCategories = ['wealth', 'career', 'love', 'health', 'study', 'general', 'family', 'social'];
      expectedCategories.forEach(category => {
        const fortunesInCategory = fortunes.filter(f => f.category === category);
        expect(fortunesInCategory.length).toBeGreaterThan(0);
      });
    });

    test('应该正确处理运势文本唯一性约束', async () => {
      const fortunes = await db.getAllFortunes();
      
      // 验证所有运势文本都是唯一的
      const texts = fortunes.map(f => f.text);
      const uniqueTexts = [...new Set(texts)];
      expect(uniqueTexts).toHaveLength(texts.length);
      
      // 验证没有空文本
      texts.forEach(text => {
        expect(text.trim().length).toBeGreaterThan(0);
      });
    });

    test('应该正确处理用户抽签记录唯一性约束', async () => {
      const testOpenid = 'uniqueness_test_user_' + Date.now();
      
      // 第一次抽签应该成功
      await expect(db.recordUserDraw(testOpenid, 1)).resolves.not.toThrow();
      
      // 重复抽签同一运势应该失败
      await expect(db.recordUserDraw(testOpenid, 1)).rejects.toThrow();
      
      // 抽签不同运势应该成功
      await expect(db.recordUserDraw(testOpenid, 2)).resolves.not.toThrow();
    });

    test('应该正确处理外键约束', async () => {
      const testOpenid = 'foreign_key_test_user_' + Date.now();
      
      // 引用存在的运势ID应该成功
      await expect(db.recordUserDraw(testOpenid, 1)).resolves.not.toThrow();
      
      // 引用不存在的运势ID应该失败
      await expect(db.recordUserDraw(testOpenid, 999)).rejects.toThrow();
      await expect(db.recordUserDraw(testOpenid, 0)).rejects.toThrow();
      await expect(db.recordUserDraw(testOpenid, -1)).rejects.toThrow();
    });

    test('数据库统计信息应该正确', async () => {
      const stats = await db.getDatabaseStats();
      
      expect(stats).toHaveProperty('fortuneCount');
      expect(stats).toHaveProperty('userDrawCount');
      expect(stats.fortuneCount).toBe(50);
      expect(stats.userDrawCount).toBeGreaterThanOrEqual(0);
      
      // 记录一些抽签后统计应该更新
      const testOpenid = 'stats_test_user_' + Date.now();
      await db.recordUserDraw(testOpenid, 1);
      
      const updatedStats = await db.getDatabaseStats();
      expect(updatedStats.fortuneCount).toBe(50); // 运势数量不变
      expect(updatedStats.userDrawCount).toBeGreaterThan(stats.userDrawCount); // 抽签记录增加
    });
  });

  describe('运势数据管理', () => {
    test('应该初始化50条运势数据', async () => {
      const fortunes = await db.getAllFortunes();
      expect(fortunes).toHaveLength(50);
    });

    test('应该能根据ID获取运势', async () => {
      const fortune = await db.getFortuneById(1);
      expect(fortune).toBeDefined();
      expect(fortune?.id).toBe(1);
      expect(fortune?.text).toBeDefined();
      expect(fortune?.category).toBeDefined();
    });

    test('获取不存在的运势应该返回undefined', async () => {
      const fortune = await db.getFortuneById(999);
      expect(fortune).toBeUndefined();
    });
  });

  describe('用户抽签记录管理', () => {
    let testOpenid: string;

    beforeEach(() => {
      testOpenid = DatabaseTestHelper.generateTestOpenid('record_test');
    });

    test('新用户应该没有抽签记录', async () => {
      const drawnIds = await db.getUserDrawnFortuneIds(testOpenid);
      expect(drawnIds).toHaveLength(0);
    });

    test('新用户应该能获取所有可用运势', async () => {
      const availableFortunes = await db.getAvailableFortunes(testOpenid);
      expect(availableFortunes).toHaveLength(50);
    });

    test('应该能记录用户抽签', async () => {
      await db.recordUserDraw(testOpenid, 1);
      
      const drawnIds = await db.getUserDrawnFortuneIds(testOpenid);
      expect(drawnIds).toContain(1);
      expect(drawnIds).toHaveLength(1);
    });

    test('记录抽签后可用运势应该减少', async () => {
      await db.recordUserDraw(testOpenid, 1);
      await db.recordUserDraw(testOpenid, 2);
      
      const availableFortunes = await db.getAvailableFortunes(testOpenid);
      expect(availableFortunes).toHaveLength(48);
      
      const availableIds = availableFortunes.map(f => f.id);
      expect(availableIds).not.toContain(1);
      expect(availableIds).not.toContain(2);
    });

    test('应该能获取用户最后抽签时间', async () => {
      const beforeDraw = await db.getLastDrawTime(testOpenid);
      expect(beforeDraw).toBeNull();
      
      await db.recordUserDraw(testOpenid, 1);
      
      const afterDraw = await db.getLastDrawTime(testOpenid);
      expect(afterDraw).toBeInstanceOf(Date);
      expect(afterDraw!.getTime()).toBeLessThanOrEqual(Date.now());
    });

    test('应该能获取用户抽签历史', async () => {
      await db.recordUserDraw(testOpenid, 1);
      await db.recordUserDraw(testOpenid, 2);
      
      const history = await db.getUserDrawHistory(testOpenid);
      expect(history).toHaveLength(2);
      expect(history[0].fortune_id).toBeDefined();
      expect(history[0].text).toBeDefined();
      expect(history[0].category).toBeDefined();
    });

    test('不应该允许重复抽取同一运势', async () => {
      await db.recordUserDraw(testOpenid, 1);
      
      await expect(db.recordUserDraw(testOpenid, 1)).rejects.toThrow();
    });
  });

  describe('数据完整性', () => {
    test('所有运势应该有唯一ID', async () => {
      const fortunes = await db.getAllFortunes();
      const ids = fortunes.map(f => f.id);
      const uniqueIds = [...new Set(ids)];
      expect(uniqueIds).toHaveLength(ids.length);
    });

    test('所有运势应该有文本内容', async () => {
      const fortunes = await db.getAllFortunes();
      fortunes.forEach(fortune => {
        expect(fortune.text).toBeDefined();
        expect(fortune.text.length).toBeGreaterThan(0);
        expect(fortune.category).toBeDefined();
      });
    });
  });

  describe('性能基准测试', () => {
    test('数据库初始化应该在合理时间内完成', async () => {
      const startTime = Date.now();
      const { db: perfDb, testDbPath: perfDbPath } = await DatabaseTestHelper.createTestDatabase();
      const initTime = Date.now() - startTime;
      
      expect(initTime).toBeLessThan(5000); // 5秒内完成初始化
      
      await DatabaseTestHelper.cleanupTestDatabase(perfDb, perfDbPath);
    });

    test('大量查询操作应该保持良好性能', async () => {
      const testOpenid = DatabaseTestHelper.generateTestOpenid('perf_test');
      
      // 记录一些抽签数据
      for (let i = 1; i <= 10; i++) {
        await db.recordUserDraw(testOpenid, i);
      }
      
      // 测试查询性能
      const startTime = Date.now();
      for (let i = 0; i < 100; i++) {
        await db.getAvailableFortunes(testOpenid);
      }
      const queryTime = Date.now() - startTime;
      
      expect(queryTime).toBeLessThan(1000); // 100次查询应该在1秒内完成
    });
  });

  describe('属性测试 - 运势ID唯一性', () => {
    /**
     * 属性 3: 运势ID唯一性
     * 验证需求：需求 2.3
     * 
     * 对于任何运势记录，其ID必须在整个系统中保持唯一
     */
    test('属性测试: 运势ID在所有操作中保持唯一性', async () => {
      // 获取所有运势数据
      const allFortunes = await db.getAllFortunes();
      
      // 验证初始状态下ID唯一性
      const initialIds = allFortunes.map(f => f.id);
      const uniqueInitialIds = [...new Set(initialIds)];
      expect(uniqueInitialIds).toHaveLength(initialIds.length);
      
      // 验证ID是连续的正整数（从1开始）
      const sortedIds = initialIds.sort((a, b) => a - b);
      for (let i = 0; i < sortedIds.length; i++) {
        expect(sortedIds[i]).toBe(i + 1);
      }
      
      // 验证每个ID都是正整数
      initialIds.forEach(id => {
        expect(id).toBeGreaterThan(0);
        expect(Number.isInteger(id)).toBe(true);
      });
      
      // 模拟多次查询操作，验证ID一致性
      for (let i = 0; i < 10; i++) {
        const fortunesAgain = await db.getAllFortunes();
        const idsAgain = fortunesAgain.map(f => f.id);
        expect(idsAgain).toEqual(initialIds);
      }
      
      // 验证通过ID查询的一致性
      for (const fortune of allFortunes) {
        const retrievedFortune = await db.getFortuneById(fortune.id);
        expect(retrievedFortune).toBeDefined();
        expect(retrievedFortune!.id).toBe(fortune.id);
        expect(retrievedFortune!.text).toBe(fortune.text);
        expect(retrievedFortune!.category).toBe(fortune.category);
      }
      
      // 验证不存在的ID返回undefined
      const nonExistentIds = [0, -1, 999, 1000];
      for (const id of nonExistentIds) {
        const result = await db.getFortuneById(id);
        expect(result).toBeUndefined();
      }
    });

    test('属性测试: 用户抽签记录中的fortune_id引用有效', async () => {
      const testOpenid = DatabaseTestHelper.generateTestOpenid('property_test');
      const allFortunes = await db.getAllFortunes();
      const validFortuneIds = allFortunes.map(f => f.id);
      
      // 记录多次抽签
      const drawCount = Math.min(10, allFortunes.length);
      const drawnIds: number[] = [];
      
      for (let i = 0; i < drawCount; i++) {
        const availableFortunes = await db.getAvailableFortunes(testOpenid);
        expect(availableFortunes.length).toBeGreaterThan(0);
        
        const fortuneToDraw = availableFortunes[0];
        await db.recordUserDraw(testOpenid, fortuneToDraw.id);
        drawnIds.push(fortuneToDraw.id);
        
        // 验证记录的fortune_id是有效的
        expect(validFortuneIds).toContain(fortuneToDraw.id);
      }
      
      // 验证用户抽签历史中的所有fortune_id都是有效的
      const userHistory = await db.getUserDrawHistory(testOpenid);
      expect(userHistory).toHaveLength(drawCount);
      
      userHistory.forEach(record => {
        expect(validFortuneIds).toContain(record.fortune_id);
        expect(drawnIds).toContain(record.fortune_id);
        
        // 验证关联的运势数据完整性
        expect(record.text).toBeDefined();
        expect(record.text.length).toBeGreaterThan(0);
        expect(record.category).toBeDefined();
      });
    });

    test('属性测试: 数据库重新初始化后ID唯一性保持', async () => {
      // 获取初始状态
      const initialFortunes = await db.getAllFortunes();
      const initialIds = initialFortunes.map(f => f.id);
      
      // 记录一些用户抽签
      const testOpenid = DatabaseTestHelper.generateTestOpenid('reinit_test');
      await db.recordUserDraw(testOpenid, 1);
      await db.recordUserDraw(testOpenid, 2);
      
      // 重新初始化数据库
      await db.reinitializeDatabase();
      
      // 等待初始化完成
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 验证重新初始化后的ID唯一性
      const newFortunes = await db.getAllFortunes();
      const newIds = newFortunes.map(f => f.id);
      const uniqueNewIds = [...new Set(newIds)];
      
      expect(uniqueNewIds).toHaveLength(newIds.length);
      expect(newIds).toHaveLength(50); // 应该有50条运势
      
      // 验证ID仍然是连续的正整数
      const sortedNewIds = newIds.sort((a, b) => a - b);
      for (let i = 0; i < sortedNewIds.length; i++) {
        expect(sortedNewIds[i]).toBe(i + 1);
      }
      
      // 验证用户抽签记录被清空
      const userDraws = await db.getUserDrawnFortuneIds(testOpenid);
      expect(userDraws).toHaveLength(0);
    });
  });
});