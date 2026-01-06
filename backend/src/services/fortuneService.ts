import { database } from '../database';
import { 
  FortuneResponse, 
  UserDrawHistoryResponse, 
  AvailableFortunesResponse,
  CooldownStatusResponse,
  DrawValidationResponse,
  DrawOptions,
  DrawResult
} from '../types';
import { config } from '../config';

export class FortuneService {
  /**
   * 检查用户抽签冷却时间
   * 编写时间间隔检查逻辑，实现10秒冷却期控制
   */
  private async checkCooldown(openid: string): Promise<number> {
    const lastDrawTime = await database.getLastDrawTime(openid);
    
    if (!lastDrawTime) {
      return 0; // 首次抽签，无冷却
    }
    
    const now = new Date();
    const timeDiff = Math.floor((now.getTime() - lastDrawTime.getTime()) / 1000);
    const remainingCooldown = config.cooldownSeconds - timeDiff;
    
    return Math.max(0, remainingCooldown);
  }

  /**
   * 获取用户冷却状态信息
   * 提供详细的冷却状态信息，包括剩余时间和下次可抽签时间
   */
  async getCooldownStatus(openid: string): Promise<CooldownStatusResponse> {
    try {
      const lastDrawTime = await database.getLastDrawTime(openid);
      
      if (!lastDrawTime) {
        return {
          isInCooldown: false,
          remainingSeconds: 0,
          nextDrawTime: null,
          lastDrawTime: null
        };
      }
      
      const now = new Date();
      const timeDiff = Math.floor((now.getTime() - lastDrawTime.getTime()) / 1000);
      const remainingSeconds = Math.max(0, config.cooldownSeconds - timeDiff);
      const isInCooldown = remainingSeconds > 0;
      
      // 计算下次可抽签时间
      const nextDrawTime = isInCooldown 
        ? new Date(lastDrawTime.getTime() + config.cooldownSeconds * 1000)
        : null;
      
      return {
        isInCooldown,
        remainingSeconds,
        nextDrawTime,
        lastDrawTime
      };
      
    } catch (error) {
      console.error('获取冷却状态失败:', error);
      throw new Error('无法获取冷却状态');
    }
  }

  /**
   * 验证抽签请求是否满足冷却要求
   * 检查距离上次抽签的时间间隔，防止频繁抽签
   */
  async validateDrawRequest(openid: string): Promise<DrawValidationResponse> {
    try {
      const cooldownStatus = await this.getCooldownStatus(openid);
      
      if (cooldownStatus.isInCooldown) {
        return {
          canDraw: false,
          reason: `请等待 ${cooldownStatus.remainingSeconds} 秒后再抽签`,
          cooldownRemaining: cooldownStatus.remainingSeconds
        };
      }
      
      return {
        canDraw: true
      };
      
    } catch (error) {
      console.error('验证抽签请求失败:', error);
      return {
        canDraw: false,
        reason: '系统错误，请稍后重试'
      };
    }
  }

  /**
   * 从可用运势中随机选择一条
   * 编写从可用运势中随机选择的函数，确保真正的随机性
   */
  private selectRandomFortune(fortunes: any[]): any {
    if (fortunes.length === 0) {
      throw new Error('没有可用的运势');
    }
    
    // 使用加密安全的随机数生成器提高随机性
    const crypto = require('crypto');
    const randomBytes = crypto.randomBytes(4);
    const randomValue = randomBytes.readUInt32BE(0);
    const randomIndex = randomValue % fortunes.length;
    
    return fortunes[randomIndex];
  }

  /**
   * 高级随机抽签算法
   * 支持权重分配和分类平衡的随机选择
   */
  private selectRandomFortuneAdvanced(fortunes: any[], options?: {
    preferCategory?: string;
    balanceCategories?: boolean;
  }): any {
    if (fortunes.length === 0) {
      throw new Error('没有可用的运势');
    }
    
    let candidateFortunes = [...fortunes];
    
    // 如果指定了偏好分类，增加该分类的权重
    if (options?.preferCategory) {
      const preferredFortunes = fortunes.filter(f => f.category === options.preferCategory);
      if (preferredFortunes.length > 0) {
        // 将偏好分类的运势重复添加，增加被选中的概率
        candidateFortunes = [...candidateFortunes, ...preferredFortunes];
      }
    }
    
    // 如果启用分类平衡，确保各分类有相对均等的机会
    if (options?.balanceCategories) {
      const categoryGroups = new Map<string, any[]>();
      
      // 按分类分组
      fortunes.forEach(fortune => {
        const category = fortune.category;
        if (!categoryGroups.has(category)) {
          categoryGroups.set(category, []);
        }
        categoryGroups.get(category)!.push(fortune);
      });
      
      // 先随机选择分类，再从该分类中随机选择
      const categories = Array.from(categoryGroups.keys());
      const randomCategoryIndex = Math.floor(Math.random() * categories.length);
      const selectedCategory = categories[randomCategoryIndex];
      candidateFortunes = categoryGroups.get(selectedCategory)!;
    }
    
    // 从候选运势中随机选择
    return this.selectRandomFortune(candidateFortunes);
  }

  /**
   * 执行完整的抽签流程
   * 包含随机选择和记录保存的完整逻辑
   */
  async performDraw(openid: string, options?: DrawOptions): Promise<DrawResult> {
    try {
      // 获取可用运势
      const availableFortunes = await database.getAvailableFortunes(openid);
      
      if (availableFortunes.length === 0) {
        return {
          success: false,
          error: '恭喜您！已经抽完了所有运势，新年好运满满！'
        };
      }
      
      // 使用高级随机算法选择运势
      const selectedFortune = options 
        ? this.selectRandomFortuneAdvanced(availableFortunes, options)
        : this.selectRandomFortune(availableFortunes);
      
      // 记录抽签（实现抽签记录保存逻辑）
      const drawTimestamp = new Date();
      await database.recordUserDraw(openid, selectedFortune.id);
      
      return {
        success: true,
        fortune: {
          id: selectedFortune.id,
          text: selectedFortune.text,
          category: selectedFortune.category
        },
        metadata: {
          totalAvailable: availableFortunes.length,
          selectedFromCategory: selectedFortune.category,
          drawTimestamp
        }
      };
      
    } catch (error) {
      console.error('执行抽签失败:', error);
      
      if (error instanceof Error && error.message.includes('SQLITE_CONSTRAINT')) {
        return {
          success: false,
          error: '抽签记录冲突，请重试'
        };
      }
      
      return {
        success: false,
        error: '抽签执行失败，请稍后重试'
      };
    }
  }

  /**
   * 执行抽签操作
   */
  async drawFortune(openid: string): Promise<FortuneResponse> {
    try {
      // 验证抽签请求（包含冷却检查）
      const validation = await this.validateDrawRequest(openid);
      
      if (!validation.canDraw) {
        return {
          success: false,
          error: validation.reason || '抽签请求被拒绝',
          cooldown: validation.cooldownRemaining
        };
      }
      
      // 执行抽签流程
      const drawResult = await this.performDraw(openid);
      
      if (!drawResult.success) {
        return {
          success: false,
          error: drawResult.error || '抽签失败'
        };
      }
      
      return {
        success: true,
        data: {
          id: drawResult.fortune!.id,
          text: drawResult.fortune!.text,
          isNew: true
        }
      };
      
    } catch (error) {
      console.error('抽签服务错误:', error);
      
      return {
        success: false,
        error: '抽签服务暂时不可用，请稍后重试'
      };
    }
  }

  /**
   * 获取用户抽签历史记录
   * 按openid查询用户抽签记录的函数
   */
  async getUserDrawHistory(openid: string): Promise<UserDrawHistoryResponse> {
    try {
      // 获取用户抽签历史（包含运势详情）
      const drawHistory = await database.getUserDrawHistory(openid);
      
      // 获取统计信息
      const stats = await database.getUserStats(openid);
      
      // 格式化历史记录
      const formattedHistory = drawHistory.map(record => ({
        id: record.fortune_id,
        text: record.text,
        category: record.category,
        timestamp: new Date(record.timestamp)
      }));
      
      return {
        history: formattedHistory,
        totalDrawn: stats.totalDrawn,
        remainingCount: stats.remainingCount
      };
      
    } catch (error) {
      console.error('获取用户抽签历史失败:', error);
      throw new Error('无法获取抽签历史');
    }
  }

  /**
   * 获取用户可用运势列表的逻辑
   * 实现获取用户可用运势列表的逻辑
   */
  async getAvailableFortunesForUser(openid: string): Promise<AvailableFortunesResponse> {
    try {
      // 获取用户可用的运势列表
      const availableFortunes = await database.getAvailableFortunes(openid);
      
      // 获取总运势数量
      const allFortunes = await database.getAllFortunes();
      
      // 格式化可用运势列表
      const formattedFortunes = availableFortunes.map(fortune => ({
        id: fortune.id,
        text: fortune.text,
        category: fortune.category
      }));
      
      return {
        availableFortunes: formattedFortunes,
        availableCount: availableFortunes.length,
        totalCount: allFortunes.length
      };
      
    } catch (error) {
      console.error('获取用户可用运势列表失败:', error);
      throw new Error('无法获取可用运势列表');
    }
  }

  /**
   * 获取用户抽签统计信息
   */
  async getUserStats(openid: string): Promise<{ totalDrawn: number; totalAvailable: number; remainingCount: number }> {
    const drawnIds = await database.getUserDrawnFortuneIds(openid);
    const allFortunes = await database.getAllFortunes();
    
    return {
      totalDrawn: drawnIds.length,
      totalAvailable: allFortunes.length,
      remainingCount: allFortunes.length - drawnIds.length
    };
  }
}

// 导出单例实例
export const fortuneService = new FortuneService();