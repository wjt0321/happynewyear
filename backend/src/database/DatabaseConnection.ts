import sqlite3 from 'sqlite3';
import { config } from '../config';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 数据库连接管理器 - 单例模式管理数据库连接
 */
export class DatabaseConnection {
  private static instance: DatabaseConnection;
  private db: sqlite3.Database | null = null;
  private isConnecting = false;
  private connectionPromise: Promise<sqlite3.Database> | null = null;

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
  async getConnection(): Promise<sqlite3.Database> {
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
      return this.db;
    } finally {
      this.isConnecting = false;
      this.connectionPromise = null;
    }
  }

  /**
   * 创建数据库连接
   */
  private createConnection(): Promise<sqlite3.Database> {
    return new Promise((resolve, reject) => {
      // 确保数据目录存在
      const dbDir = path.dirname(config.database.path);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }

      const db = new sqlite3.Database(config.database.path, (err) => {
        if (err) {
          console.error('数据库连接失败:', err);
          reject(err);
        } else {
          console.log('数据库连接成功');
          
          // 配置数据库选项
          db.configure('busyTimeout', 30000); // 30秒超时
          
          resolve(db);
        }
      });

      // 设置错误处理
      db.on('error', (err) => {
        console.error('数据库错误:', err);
      });
    });
  }

  /**
   * 检查连接状态
   */
  isConnected(): boolean {
    return this.db !== null;
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
        }
        this.db = null;
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
}