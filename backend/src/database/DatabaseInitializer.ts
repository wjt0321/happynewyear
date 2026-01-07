import { Database as SQLiteDatabase } from 'sqlite3';
import { FORTUNE_DATA } from '../config';

/**
 * 数据库操作接口
 */
interface DatabaseOperation {
  name: string;
  execute(db: SQLiteDatabase): Promise<void>;
}

/**
 * 表创建操作
 */
class TableCreationOperation implements DatabaseOperation {
  constructor(
    public readonly name: string,
    private readonly sql: string
  ) {}

  async execute(db: SQLiteDatabase): Promise<void> {
    return new Promise((resolve, reject) => {
      db.run(this.sql, (err) => {
        if (err) {
          console.error(`创建${this.name}表失败:`, err);
          reject(new Error(`表创建失败: ${this.name} - ${err.message}`));
        } else {
          console.log(`${this.name}表创建成功`);
          resolve();
        }
      });
    });
  }
}

/**
 * 索引创建操作
 */
class IndexCreationOperation implements DatabaseOperation {
  constructor(
    public readonly name: string,
    private readonly sql: string
  ) {}

  async execute(db: SQLiteDatabase): Promise<void> {
    return new Promise((resolve, reject) => {
      db.run(this.sql, (err) => {
        if (err) {
          console.error(`创建${this.name}索引失败:`, err);
          reject(new Error(`索引创建失败: ${this.name} - ${err.message}`));
        } else {
          console.log(`${this.name}索引创建成功`);
          resolve();
        }
      });
    });
  }
}

/**
 * 数据种子操作 - 重构后的版本
 */
class DataSeedingOperation implements DatabaseOperation {
  public readonly name = '运势数据种子';

  async execute(db: SQLiteDatabase): Promise<void> {
    // 检查是否已有数据
    const existingCount = await this.getFortuneCount(db);
    if (existingCount > 0) {
      console.log(`数据库中已存在 ${existingCount} 条运势数据，跳过初始化`);
      return;
    }

    console.log('开始初始化运势数据...');
    
    // 使用现代化的批量插入方法
    await this.batchInsertFortunes(db);
  }

  /**
   * 批量插入运势数据 - 使用Promise.all优化
   */
  private async batchInsertFortunes(db: SQLiteDatabase): Promise<void> {
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('BEGIN TRANSACTION', (beginErr) => {
          if (beginErr) {
            reject(new Error(`开始事务失败: ${beginErr.message}`));
            return;
          }

          const stmt = db.prepare('INSERT INTO fortunes (text, category) VALUES (?, ?)');
          
          // 使用Promise数组处理批量插入
          const insertPromises = FORTUNE_DATA.map((fortune, index) => 
            this.insertSingleFortune(stmt, fortune, index)
          );

          Promise.all(insertPromises)
            .then(() => this.finalizeTransaction(stmt, db, resolve, reject))
            .catch((error) => this.handleInsertError(stmt, db, error, reject));
        });
      });
    });
  }

  /**
   * 插入单条运势数据
   */
  private insertSingleFortune(
    stmt: any, 
    fortune: { text: string; category: string }, 
    index: number
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      stmt.run(fortune.text, fortune.category, (err: any) => {
        if (err) {
          reject(new Error(`插入第${index + 1}条运势失败: ${err.message}`));
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * 完成事务处理
   */
  private finalizeTransaction(
    stmt: any,
    db: SQLiteDatabase,
    resolve: () => void,
    reject: (error: Error) => void
  ): void {
    stmt.finalize((finalizeErr: any) => {
      if (finalizeErr) {
        console.error('完成运势数据插入时出错:', finalizeErr);
        db.run('ROLLBACK');
        reject(new Error(`语句完成失败: ${finalizeErr.message}`));
      } else {
        db.run('COMMIT', (commitErr) => {
          if (commitErr) {
            console.error('提交运势数据事务失败:', commitErr);
            reject(new Error(`事务提交失败: ${commitErr.message}`));
          } else {
            console.log(`运势数据初始化完成: 成功插入 ${FORTUNE_DATA.length} 条运势数据`);
            resolve();
          }
        });
      }
    });
  }

  /**
   * 处理插入错误
   */
  private handleInsertError(
    stmt: any,
    db: SQLiteDatabase,
    error: Error,
    reject: (error: Error) => void
  ): void {
    console.error('批量插入运势数据失败:', error);
    stmt.finalize();
    db.run('ROLLBACK');
    reject(error);
  }

  /**
   * 获取现有运势数量
   */
  private getFortuneCount(db: SQLiteDatabase): Promise<number> {
    return new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM fortunes', (err, row: any) => {
        if (err) {
          // 如果表不存在，返回0
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

/**
 * 改进后的数据库初始化器 - 使用命令模式和策略模式
 */
export class DatabaseInitializer {
  private db: SQLiteDatabase;
  private operations: DatabaseOperation[] = [];

  constructor(database: SQLiteDatabase) {
    this.db = database;
  }

  /**
   * 添加表创建操作
   */
  addTableCreation(tableName: string, sql: string): this {
    this.operations.push(new TableCreationOperation(tableName, sql));
    return this;
  }

  /**
   * 添加索引创建操作
   */
  addIndexCreation(indexName: string, sql: string): this {
    this.operations.push(new IndexCreationOperation(indexName, sql));
    return this;
  }

  /**
   * 添加数据种子操作
   */
  addDataSeeding(): this {
    this.operations.push(new DataSeedingOperation());
    return this;
  }

  /**
   * 执行所有初始化操作 - 改进的错误处理和进度跟踪
   */
  async execute(): Promise<void> {
    try {
      // 启用外键约束
      await this.runQuery('PRAGMA foreign_keys = ON');
      
      console.log(`开始执行 ${this.operations.length} 个数据库初始化操作...`);
      
      // 按顺序执行所有操作，提供进度反馈
      for (let i = 0; i < this.operations.length; i++) {
        const operation = this.operations[i];
        console.log(`执行操作 ${i + 1}/${this.operations.length}: ${operation.name}`);
        
        try {
          await operation.execute(this.db);
        } catch (error) {
          console.error(`操作失败: ${operation.name}`, error);
          throw new Error(`数据库初始化失败在操作: ${operation.name}`);
        }
      }
      
      console.log('所有数据库初始化操作完成');
    } catch (error) {
      console.error('数据库初始化过程中发生错误:', error);
      throw error;
    }
  }

  /**
   * 获取操作列表 - 用于调试和监控
   */
  getOperations(): ReadonlyArray<DatabaseOperation> {
    return [...this.operations];
  }

  /**
   * 清空操作队列
   */
  clearOperations(): void {
    this.operations = [];
  }

  /**
   * 执行单个SQL查询 - 改进的错误处理
   */
  private runQuery(sql: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(sql, (err) => {
        if (err) {
          reject(new Error(`SQL查询执行失败: ${sql} - ${err.message}`));
        } else {
          resolve();
        }
      });
    });
  }
}