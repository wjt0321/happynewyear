import { Database as SQLiteDatabase } from 'sqlite3';
import { FORTUNE_DATA } from '../config';

/**
 * 数据库初始化配置接口
 */
interface InitializerConfig {
  enableForeignKeys: boolean;
  batchSize: number;
  showProgress: boolean;
  optimizeForPerformance: boolean;
  validateData: boolean;
}

/**
 * 数据库初始化结果接口
 */
interface InitializationResult {
  success: boolean;
  operationsExecuted: number;
  totalOperations: number;
  duration: number;
  errors: string[];
  warnings: string[];
}

/**
 * 数据库操作基类
 */
abstract class DatabaseOperation {
  constructor(
    public readonly name: string,
    public readonly description: string
  ) {}

  abstract execute(db: SQLiteDatabase, config: InitializerConfig): Promise<void>;
  
  /**
   * 验证操作前置条件
   */
  async validate(db: SQLiteDatabase): Promise<string[]> {
    return []; // 默认无验证错误
  }
}

/**
 * 表创建操作类
 */
class TableCreationOperation extends DatabaseOperation {
  constructor(
    name: string,
    private readonly sql: string,
    private readonly checkExistence: boolean = true
  ) {
    super(name, `创建数据库表: ${name}`);
  }

  async execute(db: SQLiteDatabase, config: InitializerConfig): Promise<void> {
    if (this.checkExistence) {
      const exists = await this.tableExists(db);
      if (exists) {
        console.log(`表 ${this.name} 已存在，跳过创建`);
        return;
      }
    }

    return new Promise((resolve, reject) => {
      db.run(this.sql, (err) => {
        if (err) {
          const errorMsg = `创建表 ${this.name} 失败: ${err.message}`;
          console.error(errorMsg);
          reject(new Error(errorMsg));
        } else {
          console.log(`表 ${this.name} 创建成功`);
          resolve();
        }
      });
    });
  }

  async validate(db: SQLiteDatabase): Promise<string[]> {
    const errors: string[] = [];
    
    // 验证SQL语法基本正确性
    if (!this.sql.trim().toUpperCase().startsWith('CREATE TABLE')) {
      errors.push(`表创建SQL必须以CREATE TABLE开头: ${this.name}`);
    }
    
    return errors;
  }

  private async tableExists(db: SQLiteDatabase): Promise<boolean> {
    return new Promise((resolve) => {
      db.get(
        "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
        [this.name],
        (err, row) => {
          resolve(!err && !!row);
        }
      );
    });
  }
}

/**
 * 索引创建操作类
 */
class IndexCreationOperation extends DatabaseOperation {
  constructor(
    name: string,
    private readonly sql: string,
    private readonly tableName: string
  ) {
    super(name, `创建数据库索引: ${name} (表: ${tableName})`);
  }

  async execute(db: SQLiteDatabase, config: InitializerConfig): Promise<void> {
    const exists = await this.indexExists(db);
    if (exists) {
      console.log(`索引 ${this.name} 已存在，跳过创建`);
      return;
    }

    return new Promise((resolve, reject) => {
      db.run(this.sql, (err) => {
        if (err) {
          const errorMsg = `创建索引 ${this.name} 失败: ${err.message}`;
          console.error(errorMsg);
          reject(new Error(errorMsg));
        } else {
          console.log(`索引 ${this.name} 创建成功`);
          resolve();
        }
      });
    });
  }

  async validate(db: SQLiteDatabase): Promise<string[]> {
    const errors: string[] = [];
    
    // 检查依赖的表是否存在
    const tableExists = await this.tableExists(db, this.tableName);
    if (!tableExists) {
      errors.push(`索引 ${this.name} 依赖的表 ${this.tableName} 不存在`);
    }
    
    return errors;
  }

  private async indexExists(db: SQLiteDatabase): Promise<boolean> {
    return new Promise((resolve) => {
      db.get(
        "SELECT name FROM sqlite_master WHERE type='index' AND name=?",
        [this.name],
        (err, row) => {
          resolve(!err && !!row);
        }
      );
    });
  }

  private async tableExists(db: SQLiteDatabase, tableName: string): Promise<boolean> {
    return new Promise((resolve) => {
      db.get(
        "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
        [tableName],
        (err, row) => {
          resolve(!err && !!row);
        }
      );
    });
  }
}

/**
 * 数据种子操作类 - 可维护版本
 */
class DataSeedingOperation extends DatabaseOperation {
  constructor() {
    super('fortune_data_seeding', '初始化运势数据种子');
  }

  async execute(db: SQLiteDatabase, config: InitializerConfig): Promise<void> {
    const existingCount = await this.getFortuneCount(db);
    if (existingCount > 0) {
      console.log(`数据库中已存在 ${existingCount} 条运势数据，跳过初始化`);
      return;
    }

    if (config.validateData) {
      await this.validateFortuneData();
    }

    console.log(`开始初始化 ${FORTUNE_DATA.length} 条运势数据...`);
    
    if (config.optimizeForPerformance) {
      await this.performOptimizedInsert(db, config);
    } else {
      await this.performStandardInsert(db, config);
    }
  }

  async validate(db: SQLiteDatabase): Promise<string[]> {
    const errors: string[] = [];
    
    // 检查运势数据的完整性
    if (!FORTUNE_DATA || FORTUNE_DATA.length === 0) {
      errors.push('运势数据为空或未定义');
    }
    
    // 检查数据格式
    for (let i = 0; i < Math.min(FORTUNE_DATA.length, 5); i++) {
      const fortune = FORTUNE_DATA[i];
      if (!fortune.text || !fortune.category) {
        errors.push(`运势数据第 ${i + 1} 条格式不正确`);
      }
    }
    
    return errors;
  }

  /**
   * 验证运势数据的完整性和唯一性
   */
  private async validateFortuneData(): Promise<void> {
    console.log('验证运势数据完整性...');
    
    const texts = new Set<string>();
    const duplicates: string[] = [];
    
    for (const fortune of FORTUNE_DATA) {
      if (!fortune.text || !fortune.category) {
        throw new Error('发现格式不正确的运势数据');
      }
      
      if (texts.has(fortune.text)) {
        duplicates.push(fortune.text);
      } else {
        texts.add(fortune.text);
      }
    }
    
    if (duplicates.length > 0) {
      console.warn(`发现 ${duplicates.length} 条重复的运势文本`);
    }
    
    console.log(`运势数据验证完成: ${FORTUNE_DATA.length} 条数据，${duplicates.length} 条重复`);
  }

  /**
   * 标准插入方法
   */
  private async performStandardInsert(db: SQLiteDatabase, config: InitializerConfig): Promise<void> {
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        
        const stmt = db.prepare('INSERT INTO fortunes (text, category) VALUES (?, ?)');
        let completed = 0;
        let hasError = false;
        
        FORTUNE_DATA.forEach((fortune, index) => {
          stmt.run(fortune.text, fortune.category, (err: any) => {
            completed++;
            
            if (err && !hasError) {
              hasError = true;
              console.error(`插入第 ${index + 1} 条运势失败:`, err);
              stmt.finalize();
              db.run('ROLLBACK');
              reject(new Error(`数据插入失败: ${err.message}`));
              return;
            }
            
            if (config.showProgress && completed % 10 === 0) {
              console.log(`已插入 ${completed}/${FORTUNE_DATA.length} 条运势数据`);
            }
            
            if (completed === FORTUNE_DATA.length && !hasError) {
              stmt.finalize((finalizeErr) => {
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
          });
        });
      });
    });
  }

  /**
   * 优化的插入方法
   */
  private async performOptimizedInsert(db: SQLiteDatabase, config: InitializerConfig): Promise<void> {
    // 设置性能优化参数
    await this.runQuery(db, 'PRAGMA synchronous = OFF');
    await this.runQuery(db, 'PRAGMA journal_mode = MEMORY');
    
    try {
      await this.performStandardInsert(db, config);
    } finally {
      // 恢复正常设置
      await this.runQuery(db, 'PRAGMA synchronous = NORMAL');
      await this.runQuery(db, 'PRAGMA journal_mode = DELETE');
    }
  }

  private async getFortuneCount(db: SQLiteDatabase): Promise<number> {
    return new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM fortunes', (err, row: any) => {
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

  private async runQuery(db: SQLiteDatabase, sql: string): Promise<void> {
    return new Promise((resolve, reject) => {
      db.run(sql, (err) => {
        if (err) {
          reject(new Error(`查询执行失败: ${sql} - ${err.message}`));
        } else {
          resolve();
        }
      });
    });
  }
}

/**
 * 可维护的数据库初始化器
 */
export class MaintainableDatabaseInitializer {
  private db: SQLiteDatabase;
  private operations: DatabaseOperation[] = [];
  private config: InitializerConfig;

  constructor(
    database: SQLiteDatabase, 
    config: Partial<InitializerConfig> = {}
  ) {
    this.db = database;
    this.config = {
      enableForeignKeys: true,
      batchSize: 100,
      showProgress: true,
      optimizeForPerformance: false,
      validateData: true,
      ...config
    };
  }

  /**
   * 添加表创建操作
   */
  addTableCreation(tableName: string, sql: string, checkExistence: boolean = true): this {
    this.operations.push(new TableCreationOperation(tableName, sql, checkExistence));
    return this;
  }

  /**
   * 添加索引创建操作
   */
  addIndexCreation(indexName: string, sql: string, tableName: string): this {
    this.operations.push(new IndexCreationOperation(indexName, sql, tableName));
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
   * 执行所有初始化操作 - 增强版本
   */
  async execute(): Promise<InitializationResult> {
    const startTime = Date.now();
    const result: InitializationResult = {
      success: false,
      operationsExecuted: 0,
      totalOperations: this.operations.length,
      duration: 0,
      errors: [],
      warnings: []
    };

    try {
      console.log(`开始数据库初始化: ${this.operations.length} 个操作`);
      
      // 启用外键约束
      if (this.config.enableForeignKeys) {
        await this.runQuery('PRAGMA foreign_keys = ON');
      }

      // 验证所有操作
      await this.validateAllOperations(result);
      
      if (result.errors.length > 0) {
        throw new Error(`验证失败: ${result.errors.join(', ')}`);
      }

      // 执行所有操作
      for (let i = 0; i < this.operations.length; i++) {
        const operation = this.operations[i];
        
        if (this.config.showProgress) {
          console.log(`执行操作 ${i + 1}/${this.operations.length}: ${operation.description}`);
        }
        
        try {
          await operation.execute(this.db, this.config);
          result.operationsExecuted++;
        } catch (error) {
          const errorMsg = `操作失败: ${operation.name} - ${error instanceof Error ? error.message : String(error)}`;
          result.errors.push(errorMsg);
          console.error(errorMsg);
          throw error;
        }
      }
      
      result.success = true;
      result.duration = Date.now() - startTime;
      
      console.log(`数据库初始化完成: ${result.operationsExecuted} 个操作，耗时 ${result.duration}ms`);
      
    } catch (error) {
      result.success = false;
      result.duration = Date.now() - startTime;
      
      if (error instanceof Error) {
        result.errors.push(error.message);
      }
      
      console.error('数据库初始化失败:', error);
      throw error;
    }

    return result;
  }

  /**
   * 验证所有操作
   */
  private async validateAllOperations(result: InitializationResult): Promise<void> {
    console.log('验证数据库操作...');
    
    for (const operation of this.operations) {
      try {
        const errors = await operation.validate(this.db);
        result.errors.push(...errors);
      } catch (error) {
        const errorMsg = `验证操作 ${operation.name} 时出错: ${error instanceof Error ? error.message : String(error)}`;
        result.errors.push(errorMsg);
      }
    }
    
    if (result.errors.length > 0) {
      console.warn(`发现 ${result.errors.length} 个验证错误`);
    } else {
      console.log('所有操作验证通过');
    }
  }

  /**
   * 获取配置信息
   */
  getConfig(): Readonly<InitializerConfig> {
    return { ...this.config };
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<InitializerConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * 获取操作列表
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
   * 执行单个SQL查询
   */
  private async runQuery(sql: string): Promise<void> {
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