import { Database as SQLiteDatabase } from 'sqlite3';
import { Fortune } from '../../types';

/**
 * 运势数据仓库 - 封装运势相关的数据库操作
 */
export class FortuneRepository {
  constructor(private db: SQLiteDatabase) {}

  /**
   * 获取所有运势
   */
  async getAll(): Promise<Fortune[]> {
    return this.queryAll('SELECT * FROM fortunes ORDER BY id');
  }

  /**
   * 根据ID获取运势
   */
  async getById(id: number): Promise<Fortune | null> {
    const result = await this.queryOne('SELECT * FROM fortunes WHERE id = ?', [id]);
    return result || null;
  }

  /**
   * 根据分类获取运势
   */
  async getByCategory(category: string): Promise<Fortune[]> {
    return this.queryAll('SELECT * FROM fortunes WHERE category = ? ORDER BY id', [category]);
  }

  /**
   * 获取排除指定ID列表的运势
   */
  async getExcluding(excludeIds: number[]): Promise<Fortune[]> {
    if (excludeIds.length === 0) {
      return this.getAll();
    }

    const placeholders = excludeIds.map(() => '?').join(',');
    const query = `SELECT * FROM fortunes WHERE id NOT IN (${placeholders}) ORDER BY id`;
    return this.queryAll(query, excludeIds);
  }

  /**
   * 获取运势总数
   */
  async getCount(): Promise<number> {
    const result = await this.queryOne('SELECT COUNT(*) as count FROM fortunes');
    return result?.count || 0;
  }

  /**
   * 执行查询并返回多行结果
   */
  private queryAll(sql: string, params: any[] = []): Promise<Fortune[]> {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows as Fortune[]);
        }
      });
    });
  }

  /**
   * 执行查询并返回单行结果
   */
  private queryOne(sql: string, params: any[] = []): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }
}