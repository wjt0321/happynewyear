import { Database as SQLiteDatabase } from 'sqlite3';
import { config } from '../config';
import * as fs from 'fs';
import * as path from 'path';
import { createLogger } from '../utils/logger';

const logger = createLogger('DatabaseConnection');

/**
 * 数据库连接管理器 - 单例模式管理数据库连接
 */
export class DatabaseConnection {
  private static instance: DatabaseConnection;
  private db: SQLiteDatabase | null = null;
  private isConnecting = false;
  private connectionPromise: Promise<SQLiteDatabase> | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;
  private reconnectDelay = 1000; // 1秒
  private connectionListeners: Set<(connected: boolean) => void> = new Set();

  private constructor() {}

  /**
   * 获取单例实例
   */
  static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  /**
   * 获取数据库连接
   */
  async getConnection(): Promise<SQLiteDatabase> {
    if (this.db) {
      return this.db;
    }

    if (this.isConnecting && this.connectionPromise) {
      return this.connectionPromise;
    }

    this.isConnecting = true;
    this.connectionPromise = this.createConnection();
    
    try {
      this.db = await this.connectionPromise;
      this.reconnectAttempts = 0;
      this.notifyConnectionListeners(true);
      return this.db;
    } catch (error) {
      this.notifyConnectionListeners(false);
      throw error;
    } finally {
      this.isConnecting = false;
      this.connectionPromise = null;
    }
  }

  /**
   * 创建数据库连接
   */
  private createConnection(): Promise<SQLiteDatabase> {
    return new Promise((resolve, reject) => {
      // 确保数据目录存在
      const dbDir = path.dirname(config.database.path);
      if (!fs.existsSync(dbDir)) {
        try {
          fs.mkdirSync(dbDir, { recursive: true });
        } catch (mkdirError) {
          reject(new Error(`无法创建数据目录: ${mkdirError}`));
          return;
        }
      }

      const db = new SQLiteDatabase(config.database.path, (err) => {
        if (err) {
          logger.error('数据库连接失败', err);
          reject(new Error(`数据库连接失败: ${err.message}`));
        } else {
          logger.info('数据库连接成功');
          
          // 配置数据库选项
          db.configure('busyTimeout', 30000); // 30秒超时
          
          // 优化SQLite性能
          db.serialize(() => {
            db.run('PRAGMA journal_mode = WAL'); // 启用WAL模式
            db.run('PRAGMA synchronous = NORMAL'); // 平衡性能和安全性
            db.run('PRAGMA cache_size = -64000'); // 64MB缓存
            db.run('PRAGMA temp_store = MEMORY'); // 临时表使用内存
          });
          
          resolve(db);
        }
      });

      // 设置错误处理
      db.on('error', (err) => {
        logger.error('数据库错误', err);
        this.handleDatabaseError(err);
      });

      db.on('close', () => {
        logger.info('数据库连接已关闭');
        this.db = null;
        this.notifyConnectionListeners(false);
      });
    });
  }

  /**
   * 处理数据库错误，尝试重连
   */
  private handleDatabaseError(err: Error): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      logger.warn(`尝试重新连接数据库 (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      setTimeout(async () => {
        try {
          this.db = null;
          await this.getConnection();
        } catch (error) {
          logger.error('重连失败', error);
        }
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      logger.error('已达到最大重连次数，放弃重连');
      this.notifyConnectionListeners(false);
    }
  }

  /**
   * 添加连接状态监听器
   */
  addConnectionListener(listener: (connected: boolean) => void): () => void {
    this.connectionListeners.add(listener);
    return () => this.connectionListeners.delete(listener);
  }

  /**
   * 通知连接状态监听器
   */
  private notifyConnectionListeners(connected: boolean): void {
    this.connectionListeners.forEach(listener => {
      try {
        listener(connected);
      } catch (error) {
        console.error('连接状态监听器执行失败:', error);
      }
    });
  }

  /**
   * 检查连接状态
   */
  isConnected(): boolean {
    return this.db !== null;
  }

  /**
   * 执行事务
   */
  async executeTransaction<T>(
    callback: (db: SQLiteDatabase) => Promise<T>
  ): Promise<T> {
    const db = await this.getConnection();
    
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('BEGIN TRANSACTION', (beginErr) => {
          if (beginErr) {
            reject(new Error(`开始事务失败: ${beginErr.message}`));
            return;
          }

          callback(db)
            .then((result) => {
              db.run('COMMIT', (commitErr) => {
                if (commitErr) {
                  db.run('ROLLBACK');
                  reject(new Error(`提交事务失败: ${commitErr.message}`));
                } else {
                  resolve(result);
                }
              });
            })
            .catch((error) => {
              db.run('ROLLBACK', (rollbackErr) => {
                if (rollbackErr) {
                  console.error('回滚事务失败:', rollbackErr);
                }
                reject(error);
              });
            });
        });
      });
    });
  }

  /**
   * 关闭数据库连接
   */
  async close(): Promise<void> {
    if (!this.db) {
      return;
    }

    return new Promise((resolve) => {
      this.db!.close((err) => {
        if (err) {
          console.error('关闭数据库连接失败:', err);
        } else {
          console.log('数据库连接已关闭');
          this.notifyConnectionListeners(false);
        }
        this.db = null;
        this.reconnectAttempts = 0;
        resolve();
      });
    });
  }

  /**
   * 执行健康检查
   */
  async healthCheck(): Promise<boolean> {
    try {
      const db = await this.getConnection();
      return new Promise((resolve) => {
        db.get('SELECT 1', (err) => {
          resolve(!err);
        });
      });
    } catch (error) {
      return false;
    }
  }

  /**
   * 获取连接状态信息
   */
  getConnectionInfo(): {
    connected: boolean;
    connecting: boolean;
    reconnectAttempts: number;
    databasePath: string;
  } {
    return {
      connected: this.isConnected(),
      connecting: this.isConnecting,
      reconnectAttempts: this.reconnectAttempts,
      databasePath: config.database.path
    };
  }
}