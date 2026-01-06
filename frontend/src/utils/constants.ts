// 应用常量定义

// API相关常量
export const API_CONFIG = {
  BASE_URL: process.env.NODE_ENV === 'development' 
    ? 'http://localhost:3000' 
    : 'https://your-domain.com',
  TIMEOUT: 10000,
  RETRY_COUNT: 3,
  RETRY_DELAY: 1000
}

// 抽签相关常量
export const FORTUNE_CONFIG = {
  TOTAL_FORTUNES: 50,           // 总运势数量
  COOLDOWN_SECONDS: 10,         // 冷却时间（秒）
  MAX_HISTORY_COUNT: 100        // 最大历史记录数量
}

// 动画相关常量
export const ANIMATION_CONFIG = {
  SNOWFLAKE_COUNT: 20,          // 雪花数量
  FIREWORK_COUNT: 8,            // 烟花数量
  BUTTON_ANIMATION_DURATION: 300, // 按钮动画时长（毫秒）
  CARD_GLOW_DURATION: 2000      // 卡片发光动画时长（毫秒）
}

// 主题色彩常量
export const THEME_COLORS = {
  PRIMARY_RED: '#FF4757',       // 中国红
  GOLDEN_YELLOW: '#FFD700',     // 金黄色
  FESTIVE_ORANGE: '#FF6B35',    // 节庆橙
  LUCKY_GREEN: '#2ED573',       // 幸运绿
  DEEP_RED: '#C44569',          // 深红色
  WARM_WHITE: '#FFF8E7'         // 暖白色
}

// 字体大小常量
export const FONT_SIZES = {
  HERO: '48rpx',                // 主标题
  LARGE: '36rpx',               // 大标题
  MEDIUM: '28rpx',              // 中等文字
  SMALL: '24rpx',               // 小文字
  MINI: '20rpx'                 // 最小文字
}

// 本地存储键名
export const STORAGE_KEYS = {
  USER_OPENID: 'user_openid',
  USER_INFO: 'user_info',
  LAST_DRAW_TIME: 'last_draw_time',
  DRAW_HISTORY: 'draw_history',
  AVAILABLE_COUNT: 'available_count'
}

// 页面路径常量
export const PAGE_PATHS = {
  INDEX: '/pages/index/index',
  RESULT: '/pages/result/result'
}

// 错误消息常量
export const ERROR_MESSAGES = {
  NETWORK_ERROR: '网络连接失败，请检查网络后重试',
  TIMEOUT_ERROR: '请求超时，请稍后重试',
  LOGIN_FAILED: '登录失败，请重试',
  DRAW_FAILED: '抽签失败，请重试',
  COOLDOWN_ACTIVE: '请稍后再试',
  NO_MORE_FORTUNES: '您已经抽完了所有运势！',
  UNKNOWN_ERROR: '未知错误，请重试'
}

// 成功消息常量
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: '登录成功',
  DRAW_SUCCESS: '抽签成功',
  SHARE_SUCCESS: '分享成功'
}

// 运势分类常量
export const FORTUNE_CATEGORIES = {
  WEALTH: 'wealth',             // 财运
  CAREER: 'career',             // 事业
  LOVE: 'love',                 // 爱情
  HEALTH: 'health',             // 健康
  STUDY: 'study',               // 学业
  GENERAL: 'general'            // 综合
}

// 运势分类显示名称
export const FORTUNE_CATEGORY_NAMES = {
  [FORTUNE_CATEGORIES.WEALTH]: '财运',
  [FORTUNE_CATEGORIES.CAREER]: '事业',
  [FORTUNE_CATEGORIES.LOVE]: '爱情',
  [FORTUNE_CATEGORIES.HEALTH]: '健康',
  [FORTUNE_CATEGORIES.STUDY]: '学业',
  [FORTUNE_CATEGORIES.GENERAL]: '综合'
}

// 新年装饰符号
export const DECORATION_SYMBOLS = {
  SNOW: ['❄️', '⭐', '✨', '🌟', '💫'],
  CELEBRATION: ['🎊', '🎉', '✨', '🌟', '💫', '⭐'],
  NEW_YEAR: ['🧧', '🏮', '🐉', '🪙', '🎋', '🎆', '🧨', '🎭'],
  BLESSING: ['恭', '喜', '发', '财', '福', '禄', '寿', '喜']
}

// 分享配置
export const SHARE_CONFIG = {
  TITLE: '我抽到了新年好运势！',
  PATH: '/pages/index/index',
  IMAGE_URL: '/static/share-image.png'
}