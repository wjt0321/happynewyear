import sqlite3 from 'sqlite3';
import { FORTUNE_DATA } from '../config';

/**
 * 数据库初始化器 - 使用Builder模式构建数据库结构
 */
export class DatabaseInitializer {
  private db: sqlite3.Database;
  private operations: Array<() => Promise<void>> = [];

  constructor(database: sqlite3.Database) {
    this.db = database;
  }

  /**
   * 添加表创建操作
   */
  addTableCreation(tableName: string, sql: string): this {
    this.operations.push(() => this.createTable(tableName, sql));
    return this;
  }

  /**
   * 添加索引创建操作
   */
  addIndexCreation(indexName: string, sql: string): this {
    this.operations.push(() => this.createIndex(indexName, sql));
    return this;
  }

  /**
   * 添加数据种子操作
   */
  addDataSeeding(): this {
    this.operations.push(() => this.seedFortuneData());
    return this;
  }

  /**
   * 执行所有初始化操作
   */
  async execute(): Promise<void> {
    // 启用外键约束
    await this.runQuery('PRAGMA foreign_keys = ON');
    
    // 按顺序执行所有操作
    for (const operation of this.operations) {
      await operation();
    }
  }

  private createTable(tableName: string, sql: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(sql, (err) => {
        if (err) {
          console.error(`创建${tableName}表失败:`, err);
          reject(err);
        } else {
          console.log(`${tableName}表创建成功`);
          resolve();
        }
      });
    });
  }

  private createIndex(indexName: string, sql: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(sql, (err) => {
        if (err) {
          console.error(`创建${indexName}索引失败:`, err);
          reject(err);
        } else {
          console.log(`${indexName}索引创建成功`);
          resolve();
        }
      });
    });
  }

  private async seedFortuneData(): Promise<void> {
    // 检查是否已有数据
    const count = await this.getFortuneCount();
    if (count > 0) {
      console.log(`数据库中已存在 ${count} 条运势数据，跳过初始化`);
      return;
    }

    console.log('开始初始化运势数据...');
    
    try {
      await this.performBatchInsert();
      console.log(`运势数据初始化完成: 成功插入 ${FORTUNE_DATA.length} 条运势数据`);
    } catch (error) {
      console.error('运势数据初始化失败:', error);
      throw new Error(`数据种子初始化失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 执行批量插入操作
   */
  private async performBatchInsert(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        this.db.run('BEGIN TRANSACTION', (beginErr) => {
          if (beginErr) {
            reject(new Error(`开始事务失败: ${beginErr.message}`));
            return;
          }

          const stmt = this.db.prepare('INSERT INTO fortunes (text, category) VALUES (?, ?)');
          let completed = 0;
          let hasError = false;
          
          FORTUNE_DATA.forEach((fortune, index) => {
            stmt.run(fortune.text, fortune.category, (err: any) => {
              completed++;
              
              if (err && !hasError) {
                hasError = true;
                console.error(`插入第${index + 1}条运势失败:`, err);
                this.finalizeWithRollback(stmt, reject, err);
                return;
              }
              
              // 显示进度
              if (completed % 10 === 0) {
                console.log(`已插入 ${completed}/${FORTUNE_DATA.length} 条运势数据`);
              }
              
              if (completed === FORTUNE_DATA.length && !hasError) {
                this.finalizeWithCommit(stmt, resolve, reject);
              }
            });
          });
        });
      });
    });
  }

  /**
   * 完成语句并回滚事务
   */
  private finalizeWithRollback(
    stmt: sqlite3.Statement, 
    reject: (error: Error) => void, 
    originalError: any
  ): void {
    stmt.finalize(() => {
      this.db.run('ROLLBACK', () => {
        reject(new Error(`数据插入失败: ${originalError.message}`));
      });
    });
  }

  /**
   * 完成语句并提交事务
   */
  private finalizeWithCommit(
    stmt: sqlite3.Statement,
    resolve: () => void,
    reject: (error: Error) => void
  ): void {
    stmt.finalize((finalizeErr) => {
      if (finalizeErr) {
        console.error('完成运势数据插入时出错:', finalizeErr);
        this.db.run('ROLLBACK');
        reject(new Error(`语句完成失败: ${finalizeErr.message}`));
      } else {
        this.db.run('COMMIT', (commitErr: any) => {
          if (commitErr) {
            console.error('提交运势数据事务失败:', commitErr);
            reject(new Error(`事务提交失败: ${commitErr.message}`));
          } else {
            resolve();
          }
        });
      }
    });
  }

  private getFortuneCount(): Promise<number> {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT COUNT(*) as count FROM fortunes', (err, row: any) => {
        if (err) {
          // 如果表不存在，返回0
          if (err.message.includes('no such table')) {
            resolve(0);
          } else {
            reject(err);
          }
        } else {
          resolve(row.count);
        }
      });
    });
  }

  private runQuery(sql: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(sql, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
}