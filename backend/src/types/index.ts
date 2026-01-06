// 数据库相关类型定义
export interface Fortune {
  id: number;
  text: string;
  category: FortuneCategory;
  created_at: string;
}

export interface UserDraw {
  id: number;
  openid: string;
  fortune_id: number;
  timestamp: string;
}

// 运势分类枚举
export type FortuneCategory = 
  | 'wealth'    // 财运
  | 'career'    // 事业
  | 'love'      // 爱情
  | 'health'    // 健康
  | 'study'     // 学业
  | 'general'   // 综合
  | 'family'    // 家庭
  | 'social';   // 社交

// 数据库操作结果类型
export interface DatabaseOperationResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// 用户抽签统计信息
export interface UserDrawStats {
  totalDrawn: number;
  totalAvailable: number;
  remainingCount: number;
  lastDrawTime: Date | null;
}

// 数据库统计信息
export interface DatabaseStats {
  fortuneCount: number;
  userDrawCount: number;
  uniqueUsers: number;
}

// 微信登录相关类型定义
export interface WeChatLoginRequest {
  code: string;
}

export interface WeChatLoginResponse {
  success: boolean;
  openid?: string;
  error?: string;
}

export interface WeChatUserInfo {
  openId: string;
  nickName: string;
  gender: number;
  language: string;
  city: string;
  province: string;
  country: string;
  avatarUrl: string;
}

// API请求和响应类型定义
export interface FortuneRequest {
  openid: string;
}

export interface FortuneResponse {
  success: boolean;
  data?: {
    id: number;
    text: string;
    isNew: boolean;
  };
  error?: string;
  cooldown?: number; // 剩余冷却时间（秒）
}

export interface HealthResponse {
  status: 'ok';
  timestamp: string;
  database: 'connected' | 'error';
}

// 抽签选项类型
export interface DrawOptions {
  preferCategory?: string;
  balanceCategories?: boolean;
}

// 抽签结果类型
export interface DrawResult {
  success: boolean;
  fortune?: {
    id: number;
    text: string;
    category: string;
  };
  error?: string;
  metadata?: {
    totalAvailable: number;
    selectedFromCategory: string;
    drawTimestamp: Date;
  };
}

// 冷却状态响应类型
export interface CooldownStatusResponse {
  isInCooldown: boolean;
  remainingSeconds: number;
  nextDrawTime: Date | null;
  lastDrawTime: Date | null;
}

// 抽签请求验证响应类型
export interface DrawValidationResponse {
  canDraw: boolean;
  reason?: string;
  cooldownRemaining?: number;
}

// 用户抽签历史响应类型
export interface UserDrawHistoryResponse {
  history: Array<{
    id: number;
    text: string;
    category: string;
    timestamp: Date;
  }>;
  totalDrawn: number;
  remainingCount: number;
}

// 用户可用运势响应类型
export interface AvailableFortunesResponse {
  availableFortunes: Array<{
    id: number;
    text: string;
    category: string;
  }>;
  availableCount: number;
  totalCount: number;
}

// 数据库配置类型
export interface DatabaseConfig {
  path: string;
  options?: {
    verbose?: boolean;
    fileMustExist?: boolean;
  };
}

// 应用配置类型
export interface AppConfig {
  port: number;
  database: DatabaseConfig;
  cors: {
    origin: string[];
    credentials: boolean;
  };
  cooldownSeconds: number;
}