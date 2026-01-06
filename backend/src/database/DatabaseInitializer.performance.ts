import sqlite3 from 'sqlite3';
import { FORTUNE_DATA } from '../config';

/**
 * 高性能数据库初始化器
 * 专注于批量操作和性能优化
 */
export class PerformanceDatabaseInitializer {
  private db: sqlite3.Database;
  private batchSize: number;

  constructor(database: sqlite3.Database, batchSize: number = 100) {
    this.db = database;
    this.batchSize = batchSize;
  }

  /**
   * 高性能批量插入运势数据
   * 使用批量插入和事务优化
   */
  async seedFortuneDataOptimized(): Promise<void> {
    const existingCount = await this.getFortuneCount();
    if (existingCount > 0) {
      console.log(`数据库中已存在 ${existingCount} 条运势数据，跳过初始化`);
      return;
    }

    console.log('开始高性能运势数据初始化...');
    const startTime = Date.now();

    // 使用单个事务和批量插入
    await this.performBatchInsert();

    const duration = Date.now() - startTime;
    console.log(`运势数据初始化完成: ${FORTUNE_DATA.length} 条记录，耗时 ${duration}ms`);
  }

  /**
   * 执行批量插入 - 优化版本
   */
  private async performBatchInsert(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        // 优化SQLite设置以提高插入性能
        this.db.run('PRAGMA synchronous = OFF');
        this.db.run('PRAGMA journal_mode = MEMORY');
        this.db.run('BEGIN TRANSACTION');

        // 使用单个预编译语句
        const stmt = this.db.prepare('INSERT INTO fortunes (text, category) VALUES (?, ?)');
        
        let insertedCount = 0;
        let hasError = false;

        // 批量插入数据
        for (const fortune of FORTUNE_DATA) {
          if (hasError) break;

          stmt.run(fortune.text, fortune.category, (err) => {
            if (err && !hasError) {
              hasError = true;
              console.error('插入运势数据失败:', err);
              stmt.finalize();
              this.db.run('ROLLBACK');
              reject(new Error(`批量插入失败: ${err.message}`));
              return;
            }

            insertedCount++;
            
            // 显示进度
            if (insertedCount % 10 === 0) {
              console.log(`已插入 ${insertedCount}/${FORTUNE_DATA.length} 条运势数据`);
            }

            if (insertedCount === FORTUNE_DATA.length && !hasError) {
              stmt.finalize((finalizeErr) => {
                if (finalizeErr) {
                  this.db.run('ROLLBACK');
                  reject(new Error(`语句完成失败: ${finalizeErr.message}`));
                } else {
                  this.db.run('COMMIT', (commitErr) => {
                    if (commitErr) {
                      reject(new Error(`事务提交失败: ${commitErr.message}`));
                    } else {
                      // 恢复正常的SQLite设置
                      this.db.run('PRAGMA synchronous = NORMAL');
                      this.db.run('PRAGMA journal_mode = DELETE');
                      resolve();
                    }
                  });
                }
              });
            }
          });
        }
      });
    });
  }

  /**
   * 使用现代async/await的批量插入方法
   */
  async seedFortuneDataModern(): Promise<void> {
    const existingCount = await this.getFortuneCount();
    if (existingCount > 0) {
      console.log(`数据库中已存在 ${existingCount} 条运势数据，跳过初始化`);
      return;
    }

    console.log('开始现代化运势数据初始化...');
    
    try {
      // 设置性能优化参数
      await this.optimizeForBulkInsert();
      
      // 开始事务
      await this.runQuery('BEGIN TRANSACTION');
      
      // 准备语句
      const stmt = await this.prepareStatement('INSERT INTO fortunes (text, category) VALUES (?, ?)');
      
      // 批量插入
      for (let i = 0; i < FORTUNE_DATA.length; i++) {
        const fortune = FORTUNE_DATA[i];
        await this.runStatement(stmt, [fortune.text, fortune.category]);
        
        if ((i + 1) % 10 === 0) {
          console.log(`已插入 ${i + 1}/${FORTUNE_DATA.length} 条运势数据`);
        }
      }
      
      // 完成语句和事务
      await this.finalizeStatement(stmt);
      await this.runQuery('COMMIT');
      
      // 恢复正常设置
      await this.restoreNormalSettings();
      
      console.log(`运势数据初始化完成: 成功插入 ${FORTUNE_DATA.length} 条运势数据`);
      
    } catch (error) {
      console.error('现代化批量插入失败:', error);
      await this.runQuery('ROLLBACK').catch(() => {}); // 忽略回滚错误
      throw error;
    }
  }

  /**
   * 优化SQLite设置以提高批量插入性能
   */
  private async optimizeForBulkInsert(): Promise<void> {
    await this.runQuery('PRAGMA synchronous = OFF');
    await this.runQuery('PRAGMA journal_mode = MEMORY');
    await this.runQuery('PRAGMA temp_store = MEMORY');
    await this.runQuery('PRAGMA cache_size = 10000');
  }

  /**
   * 恢复正常的SQLite设置
   */
  private async restoreNormalSettings(): Promise<void> {
    await this.runQuery('PRAGMA synchronous = NORMAL');
    await this.runQuery('PRAGMA journal_mode = DELETE');
    await this.runQuery('PRAGMA temp_store = DEFAULT');
    await this.runQuery('PRAGMA cache_size = 2000');
  }

  /**
   * Promise化的语句准备
   */
  private prepareStatement(sql: string): Promise<sqlite3.Statement> {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(sql, (err) => {
        if (err) {
          reject(new Error(`语句准备失败: ${err.message}`));
        } else {
          resolve(stmt);
        }
      });
    });
  }

  /**
   * Promise化的语句执行
   */
  private runStatement(stmt: sqlite3.Statement, params: any[]): Promise<void> {
    return new Promise((resolve, reject) => {
      stmt.run(params, (err) => {
        if (err) {
          reject(new Error(`语句执行失败: ${err.message}`));
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Promise化的语句完成
   */
  private finalizeStatement(stmt: sqlite3.Statement): Promise<void> {
    return new Promise((resolve, reject) => {
      stmt.finalize((err) => {
        if (err) {
          reject(new Error(`语句完成失败: ${err.message}`));
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Promise化的查询执行
   */
  private runQuery(sql: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(sql, (err) => {
        if (err) {
          reject(new Error(`查询执行失败: ${sql} - ${err.message}`));
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * 获取运势数量
   */
  private getFortuneCount(): Promise<number> {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT COUNT(*) as count FROM fortunes', (err, row: any) => {
        if (err) {
          if (err.message.includes('no such table')) {
            resolve(0);
          } else {
            reject(new Error(`查询运势数量失败: ${err.message}`));
          }
        } else {
          resolve(row.count);
        }
      });
    });
  }
}