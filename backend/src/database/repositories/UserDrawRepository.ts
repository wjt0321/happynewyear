import sqlite3 from 'sqlite3';
import { UserDraw, Fortune } from '../../types';

/**
 * 用户抽签记录仓库 - 封装用户抽签相关的数据库操作
 */
export class UserDrawRepository {
  constructor(private db: sqlite3.Database) {}

  /**
   * 记录用户抽签
   */
  async create(openid: string, fortuneId: number): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT INTO user_draws (openid, fortune_id) VALUES (?, ?)', 
        [openid, fortuneId], 
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });
  }

  /**
   * 获取用户已抽过的运势ID列表
   */
  async getDrawnFortuneIds(openid: string): Promise<number[]> {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT fortune_id FROM user_draws WHERE openid = ?', 
        [openid], 
        (err, rows: any[]) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows.map(r => r.fortune_id));
          }
        }
      );
    });
  }

  /**
   * 获取用户最后一次抽签时间
   */
  async getLastDrawTime(openid: string): Promise<Date | null> {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT timestamp FROM user_draws WHERE openid = ? ORDER BY timestamp DESC LIMIT 1', 
        [openid], 
        (err, row: any) => {
          if (err) {
            reject(err);
          } else {
            resolve(row ? new Date(row.timestamp) : null);
          }
        }
      );
    });
  }

  /**
   * 获取用户抽签历史（包含运势详情）
   */
  async getDrawHistory(openid: string): Promise<(UserDraw & Fortune)[]> {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT ud.*, f.text, f.category 
        FROM user_draws ud 
        JOIN fortunes f ON ud.fortune_id = f.id 
        WHERE ud.openid = ? 
        ORDER BY ud.timestamp DESC
      `;
      
      this.db.all(query, [openid], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows as (UserDraw & Fortune)[]);
        }
      });
    });
  }

  /**
   * 获取用户抽签统计信息
   */
  async getDrawStats(openid: string): Promise<{totalDrawn: number, lastDrawTime: Date | null}> {
    const [drawnIds, lastDrawTime] = await Promise.all([
      this.getDrawnFortuneIds(openid),
      this.getLastDrawTime(openid)
    ]);

    return {
      totalDrawn: drawnIds.length,
      lastDrawTime
    };
  }

  /**
   * 获取总抽签记录数
   */
  async getTotalCount(): Promise<number> {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT COUNT(*) as count FROM user_draws', (err, row: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(row.count);
        }
      });
    });
  }
}