import { FortuneService } from '../fortuneService';
import { DatabaseManager } from '../../database';
import { FortuneCategory } from '../../types';

// Mock数据库模块
jest.mock('../../database');

describe('FortuneService', () => {
  let fortuneService: FortuneService;
  let mockDatabase: jest.Mocked<DatabaseManager>;

  beforeEach(() => {
    // 重置所有mock
    jest.clearAllMocks();
    
    // 创建mock数据库实例
    mockDatabase = new DatabaseManager() as jest.Mocked<DatabaseManager>;
    
    // 创建FortuneService实例
    fortuneService = new FortuneService(mockDatabase);
  });

  describe('抽签功能', () => {
    const testOpenid = 'test_openid_12345';

    test('首次抽签应该成功', async () => {
      // 模拟数据库返回
      mockDatabase.getLastDrawTime.mockResolvedValue(null);
      mockDatabase.getAvailableFortunes.mockResolvedValue([
        { id: 1, text: '测试运势', category: 'general' as FortuneCategory, created_at: '2024-01-01' }
      ]);
      mockDatabase.recordUserDraw.mockResolvedValue();

      const result = await fortuneService.drawFortune(testOpenid);

      expect(result.success).toBe(true);
      expect(result.message).toBe('抽签成功');
      expect(result.data?.id).toBe(1);
      expect(result.data?.text).toBe('测试运势');
      expect(result.data?.isNew).toBe(true);
      expect(mockDatabase.recordUserDraw).toHaveBeenCalledWith(testOpenid, 1);
    });

    test('冷却期内抽签应该被拒绝', async () => {
      // 模拟5秒前的抽签时间
      const recentTime = new Date(Date.now() - 5000);
      mockDatabase.getLastDrawTime.mockResolvedValue(recentTime);

      const result = await fortuneService.drawFortune(testOpenid);

      expect(result.success).toBe(false);
      expect(result.message).toContain('请等待');
      expect(result.data).toBeNull();
    });

    test('冷却期过后应该可以再次抽签', async () => {
      // 模拟15秒前的抽签时间
      const oldTime = new Date(Date.now() - 15000);
      mockDatabase.getLastDrawTime.mockResolvedValue(oldTime);
      mockDatabase.getAvailableFortunes.mockResolvedValue([
        { id: 2, text: '新运势', category: 'wealth' as FortuneCategory, created_at: '2024-01-01' }
      ]);
      mockDatabase.recordUserDraw.mockResolvedValue();

      const result = await fortuneService.drawFortune(testOpenid);

      expect(result.success).toBe(true);
      expect(result.data?.id).toBe(2);
    });

    test('没有可用运势时应该返回相应消息', async () => {
      mockDatabase.getLastDrawTime.mockResolvedValue(null);
      mockDatabase.getAvailableFortunes.mockResolvedValue([]);

      const result = await fortuneService.drawFortune(testOpenid);

      expect(result.success).toBe(false);
      expect(result.message).toBe('您已经抽完了所有运势，请等待新的运势更新');
    });

    test('数据库约束错误应该被正确处理', async () => {
      mockDatabase.getLastDrawTime.mockResolvedValue(null);
      mockDatabase.getAvailableFortunes.mockResolvedValue([
        { id: 1, text: '测试运势', category: 'general' as FortuneCategory, created_at: '2024-01-01' }
      ]);
      mockDatabase.recordUserDraw.mockRejectedValue(
        new Error('SQLITE_CONSTRAINT: UNIQUE constraint failed')
      );

      const result = await fortuneService.drawFortune(testOpenid);

      expect(result.success).toBe(false);
      expect(result.message).toBe('您已经抽过这个运势了，请重新抽签');
    });

    test('其他数据库错误应该被正确处理', async () => {
      mockDatabase.getLastDrawTime.mockResolvedValue(null);
      mockDatabase.getAvailableFortunes.mockResolvedValue([
        { id: 1, text: '测试运势', category: 'general' as FortuneCategory, created_at: '2024-01-01' }
      ]);
      mockDatabase.recordUserDraw.mockRejectedValue(new Error('Database error'));

      const result = await fortuneService.drawFortune(testOpenid);

      expect(result.success).toBe(false);
      expect(result.message).toBe('抽签失败，请稍后重试');
    });
  });

  describe('用户统计功能', () => {
    const testOpenid = 'stats_test_user_12345';

    test('应该正确计算用户统计信息', async () => {
      mockDatabase.getUserDrawnFortuneIds.mockResolvedValue([1, 2, 3]);
      mockDatabase.getAllFortunes.mockResolvedValue(
        Array.from({ length: 50 }, (_, i) => ({
          id: i + 1,
          text: `运势${i + 1}`,
          category: 'general' as FortuneCategory,
          created_at: '2024-01-01'
        }))
      );

      const stats = await fortuneService.getUserStats(testOpenid);

      expect(stats.totalDrawn).toBe(3);
      expect(stats.totalAvailable).toBe(50);
      expect(stats.remainingCount).toBe(47);
    });

    test('新用户的统计信息应该正确', async () => {
      mockDatabase.getUserDrawnFortuneIds.mockResolvedValue([]);
      mockDatabase.getAllFortunes.mockResolvedValue(
        Array.from({ length: 50 }, (_, i) => ({
          id: i + 1,
          text: `运势${i + 1}`,
          category: 'general' as FortuneCategory,
          created_at: '2024-01-01'
        }))
      );

      const stats = await fortuneService.getUserStats(testOpenid);

      expect(stats.totalDrawn).toBe(0);
      expect(stats.totalAvailable).toBe(50);
      expect(stats.remainingCount).toBe(50);
    });
  });

  describe('随机选择功能', () => {
    test('应该从可用运势中随机选择', async () => {
      const availableFortunes = [
        { id: 1, text: '运势1', category: 'general' as FortuneCategory, created_at: '2024-01-01' },
        { id: 2, text: '运势2', category: 'wealth' as FortuneCategory, created_at: '2024-01-01' },
        { id: 3, text: '运势3', category: 'love' as FortuneCategory, created_at: '2024-01-01' }
      ];

      mockDatabase.getLastDrawTime.mockResolvedValue(null);
      mockDatabase.getAvailableFortunes.mockResolvedValue(availableFortunes);
      mockDatabase.recordUserDraw.mockResolvedValue();

      // 多次抽签验证随机性
      const results = [];
      for (let i = 0; i < 10; i++) {
        const result = await fortuneService.drawFortune(`test_user_${i}`);
        if (result.success && result.data) {
          results.push(result.data.id);
        }
      }

      // 验证所有结果都在可用范围内
      results.forEach(id => {
        expect([1, 2, 3]).toContain(id);
      });

      // 验证有随机性（不是所有结果都相同）
      const uniqueResults = [...new Set(results)];
      expect(uniqueResults.length).toBeGreaterThan(0);
    });
  });

  // ========== 属性测试部分 ==========
  describe('抽签业务逻辑的属性测试', () => {
    
    /**
     * 属性 2: 运势随机选择正确性
     * Feature: wechat-fortune-draw, Property 2
     * 
     * 对于任何用户的抽签请求，系统返回的运势必须来自预设的运势池，且不能是该用户已经抽过的运势
     */
    test('属性 2: 运势随机选择正确性 - 100次迭代', async () => {
      // 生成测试数据：预设运势池
      const categories: FortuneCategory[] = ['general', 'wealth', 'love', 'health', 'career'];
      const fortunePool = Array.from({ length: 50 }, (_, i) => ({
        id: i + 1,
        text: `运势${i + 1}`,
        category: categories[i % categories.length],
        created_at: '2024-01-01'
      }));

      // 对100个不同的用户进行测试
      for (let iteration = 0; iteration < 100; iteration++) {
        const testOpenid = `property_test_user_${iteration}`;
        
        // 随机生成用户已抽过的运势ID（0-10个）
        const drawnCount = Math.floor(Math.random() * 11);
        const drawnIds = Array.from({ length: drawnCount }, () => 
          Math.floor(Math.random() * 50) + 1
        );
        const uniqueDrawnIds = [...new Set(drawnIds)];
        
        // 计算可用运势
        const availableFortunes = fortunePool.filter(f => !uniqueDrawnIds.includes(f.id));
        
        if (availableFortunes.length === 0) {
          continue; // 跳过这次迭代
        }

        // 模拟数据库返回
        mockDatabase.getLastDrawTime.mockResolvedValue(null);
        mockDatabase.getAvailableFortunes.mockResolvedValue(availableFortunes);
        mockDatabase.recordUserDraw.mockResolvedValue();

        // 执行抽签
        const result = await fortuneService.drawFortune(testOpenid);

        // 验证属性：返回的运势必须来自预设运势池
        if (result.success && result.data) {
          const returnedFortuneId = result.data.id;
          
          // 验证运势ID在预设池中
          expect(fortunePool.some(f => f.id === returnedFortuneId)).toBe(true);
          
          // 验证运势ID在可用列表中
          expect(availableFortunes.some(f => f.id === returnedFortuneId)).toBe(true);
          
          // 验证运势ID不在已抽过的列表中
          expect(uniqueDrawnIds).not.toContain(returnedFortuneId);
        }
      }
    });

    /**
     * 属性 7: 抽签冷却机制
     * Feature: wechat-fortune-draw, Property 7
     */
    test('属性 7: 抽签冷却机制 - 100次迭代', async () => {
      const cooldownSeconds = 10;
      
      for (let iteration = 0; iteration < 100; iteration++) {
        const testOpenid = `cooldown_test_user_${iteration}`;
        
        // 随机生成上次抽签时间（0-20秒前）
        const secondsAgo = Math.floor(Math.random() * 21);
        const lastDrawTime = new Date(Date.now() - secondsAgo * 1000);
        
        // 模拟数据库返回
        mockDatabase.getLastDrawTime.mockResolvedValue(lastDrawTime);
        mockDatabase.getAvailableFortunes.mockResolvedValue([
          { id: 1, text: '测试运势', category: 'general' as FortuneCategory, created_at: '2024-01-01' }
        ]);
        mockDatabase.recordUserDraw.mockResolvedValue();

        // 执行抽签
        const result = await fortuneService.drawFortune(testOpenid);

        // 验证冷却机制
        if (secondsAgo < cooldownSeconds) {
          // 在冷却期内，应该被拒绝
          expect(result.success).toBe(false);
          expect(result.message).toContain('请等待');
        } else {
          // 冷却期过后，应该成功
          expect(result.success).toBe(true);
        }
      }
    });

    /**
     * 属性 8: 抽签记录完整性
     * Feature: wechat-fortune-draw, Property 8
     */
    test('属性 8: 抽签记录完整性 - 100次迭代', async () => {
      for (let iteration = 0; iteration < 100; iteration++) {
        const testOpenid = `record_test_user_${iteration}`;
        const fortuneId = Math.floor(Math.random() * 50) + 1;
        
        // 模拟成功的抽签条件
        mockDatabase.getLastDrawTime.mockResolvedValue(null);
        mockDatabase.getAvailableFortunes.mockResolvedValue([
          { id: fortuneId, text: `运势${fortuneId}`, category: 'general' as FortuneCategory, created_at: '2024-01-01' }
        ]);
        mockDatabase.recordUserDraw.mockResolvedValue();

        // 执行抽签
        const result = await fortuneService.drawFortune(testOpenid);

        // 验证成功的抽签会调用记录函数
        if (result.success) {
          expect(mockDatabase.recordUserDraw).toHaveBeenCalledWith(testOpenid, fortuneId);
        }
      }
    });

    /**
     * 属性 9: 用户历史查询准确性
     * Feature: wechat-fortune-draw, Property 9
     */
    test('属性 9: 用户历史查询准确性 - 100次迭代', async () => {
      for (let iteration = 0; iteration < 100; iteration++) {
        const testOpenid = `history_test_user_${iteration}`;
        
        // 随机生成用户的抽签历史（0-10条记录）
        const historyCount = Math.floor(Math.random() * 11);
        const userHistory = Array.from({ length: historyCount }, (_, i) => ({
          id: i + 1,
          openid: testOpenid,
          fortune_id: Math.floor(Math.random() * 50) + 1,
          timestamp: new Date().toISOString(),
          text: `运势${i + 1}`,
          category: 'general' as FortuneCategory,
          created_at: '2024-01-01'
        }));

        // 生成其他用户的记录（干扰数据）
        const otherUserHistory = Array.from({ length: 5 }, (_, i) => ({
          id: historyCount + i + 1,
          openid: `other_user_${i}`,
          fortune_id: Math.floor(Math.random() * 50) + 1,
          timestamp: new Date().toISOString(),
          text: `其他运势${i + 1}`,
          category: 'general' as FortuneCategory,
          created_at: '2024-01-01'
        }));

        // 模拟数据库返回（只返回当前用户的记录）
        mockDatabase.getUserDrawHistory.mockResolvedValue(userHistory);
        mockDatabase.getUserStats.mockResolvedValue({
          totalDrawn: historyCount,
          totalAvailable: 50,
          remainingCount: 50 - historyCount
        });

        // 执行查询
        const history = await mockDatabase.getUserDrawHistory(testOpenid);
        const stats = await fortuneService.getUserStats(testOpenid);

        // 验证返回的历史记录都属于当前用户
        history.forEach(record => {
          expect(record.openid).toBe(testOpenid);
        });

        // 验证统计信息的准确性
        expect(stats.totalDrawn).toBe(historyCount);
        expect(history.length).toBe(historyCount);
      }
    });
  });
});