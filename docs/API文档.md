# 📡 微信小程序新年抽签应用 - API文档

## 🌐 API概览

### 基础信息
- **Base URL**: `https://your-domain.com/api`
- **协议**: HTTPS
- **数据格式**: JSON
- **字符编码**: UTF-8
- **认证方式**: 微信openid

### 通用响应格式
```json
{
  "success": boolean,
  "data": object | null,
  "error": string | null,
  "timestamp": string,
  "cooldown": number | null
}
```

## 🎲 抽签相关接口

### 1. 抽签接口

**接口地址**: `POST /api/fortune`

**功能描述**: 用户抽取新年运势

**请求参数**:
```json
{
  "openid": "string"  // 微信用户唯一标识，必填
}
```

**请求示例**:
```bash
curl -X POST https://your-domain.com/api/fortune \
  -H "Content-Type: application/json" \
  -d '{
    "openid": "oU7Hw5FuW8gX9Z2K3mN4pQ6rS8tV"
  }'
```

**成功响应**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "text": "2026年财运爆棚，金银满屋！",
    "category": "wealth",
    "isNew": true
  },
  "error": null,
  "timestamp": "2026-01-06T12:00:00.000Z"
}
```

**冷却期响应**:
```json
{
  "success": false,
  "data": null,
  "error": "抽签冷却中",
  "cooldown": 8,
  "timestamp": "2026-01-06T12:00:00.000Z"
}
```

**运势池耗尽响应**:
```json
{
  "success": false,
  "data": null,
  "error": "您已经抽完了所有运势！",
  "timestamp": "2026-01-06T12:00:00.000Z"
}
```

**错误响应**:
```json
{
  "success": false,
  "data": null,
  "error": "缺少必需参数: openid",
  "timestamp": "2026-01-06T12:00:00.000Z"
}
```

**状态码说明**:
- `200`: 请求成功
- `400`: 请求参数错误
- `429`: 请求过于频繁（冷却期）
- `500`: 服务器内部错误

---

### 2. 获取用户抽签历史

**接口地址**: `GET /api/fortune/history`

**功能描述**: 获取用户的抽签历史记录

**请求参数**:
```
openid: string  // URL参数，微信用户唯一标识
limit: number   // 可选，返回记录数量，默认10，最大50
offset: number  // 可选，偏移量，默认0
```

**请求示例**:
```bash
curl "https://your-domain.com/api/fortune/history?openid=oU7Hw5FuW8gX9Z2K3mN4pQ6rS8tV&limit=5"
```

**成功响应**:
```json
{
  "success": true,
  "data": {
    "total": 15,
    "records": [
      {
        "id": 1,
        "fortune_id": 23,
        "fortune_text": "新年新气象，事业蒸蒸日上！",
        "category": "career",
        "timestamp": "2026-01-06T10:30:00.000Z"
      },
      {
        "id": 2,
        "fortune_id": 8,
        "fortune_text": "桃花朵朵开，爱情甜如蜜！",
        "category": "love",
        "timestamp": "2026-01-05T15:20:00.000Z"
      }
    ]
  },
  "error": null,
  "timestamp": "2026-01-06T12:00:00.000Z"
}
```

---

### 3. 获取可用运势数量

**接口地址**: `GET /api/fortune/available`

**功能描述**: 获取用户还可以抽取的运势数量

**请求参数**:
```
openid: string  // URL参数，微信用户唯一标识
```

**请求示例**:
```bash
curl "https://your-domain.com/api/fortune/available?openid=oU7Hw5FuW8gX9Z2K3mN4pQ6rS8tV"
```

**成功响应**:
```json
{
  "success": true,
  "data": {
    "total_fortunes": 50,
    "drawn_count": 15,
    "available_count": 35,
    "completion_rate": 0.3
  },
  "error": null,
  "timestamp": "2026-01-06T12:00:00.000Z"
}
```

## 🏥 系统状态接口

### 1. 健康检查

**接口地址**: `GET /api/health`

**功能描述**: 检查系统运行状态

**请求参数**: 无

**请求示例**:
```bash
curl https://your-domain.com/api/health
```

**成功响应**:
```json
{
  "status": "ok",
  "timestamp": "2026-01-06T12:00:00.000Z",
  "database": "connected",
  "version": "1.0.0",
  "uptime": 86400,
  "memory_usage": {
    "used": "45.2 MB",
    "total": "512 MB",
    "percentage": 8.8
  }
}
```

**异常响应**:
```json
{
  "status": "error",
  "timestamp": "2026-01-06T12:00:00.000Z",
  "database": "disconnected",
  "error": "Database connection failed"
}
```

---

### 2. 系统统计信息

**接口地址**: `GET /api/stats`

**功能描述**: 获取系统统计信息（管理员接口）

**请求参数**: 无

**请求示例**:
```bash
curl https://your-domain.com/api/stats
```

**成功响应**:
```json
{
  "success": true,
  "data": {
    "total_users": 1250,
    "total_draws": 8750,
    "active_users_today": 156,
    "draws_today": 892,
    "popular_fortunes": [
      {
        "id": 23,
        "text": "新年新气象，事业蒸蒸日上！",
        "draw_count": 89
      },
      {
        "id": 8,
        "text": "桃花朵朵开，爱情甜如蜜！",
        "draw_count": 76
      }
    ],
    "fortune_distribution": {
      "wealth": 1850,
      "career": 1650,
      "love": 1450,
      "health": 1800,
      "study": 1200,
      "general": 800
    }
  },
  "error": null,
  "timestamp": "2026-01-06T12:00:00.000Z"
}
```

## 👤 用户相关接口

### 1. 用户信息

**接口地址**: `GET /api/user/info`

**功能描述**: 获取用户基本信息和统计数据

**请求参数**:
```
openid: string  // URL参数，微信用户唯一标识
```

**请求示例**:
```bash
curl "https://your-domain.com/api/user/info?openid=oU7Hw5FuW8gX9Z2K3mN4pQ6rS8tV"
```

**成功响应**:
```json
{
  "success": true,
  "data": {
    "openid": "oU7Hw5FuW8gX9Z2K3mN4pQ6rS8tV",
    "first_draw_time": "2026-01-01T08:00:00.000Z",
    "last_draw_time": "2026-01-06T10:30:00.000Z",
    "total_draws": 15,
    "favorite_category": "wealth",
    "streak_days": 6,
    "achievements": [
      "first_draw",
      "week_streak",
      "category_master"
    ]
  },
  "error": null,
  "timestamp": "2026-01-06T12:00:00.000Z"
}
```

---

### 2. 用户冷却状态

**接口地址**: `GET /api/user/cooldown`

**功能描述**: 获取用户当前的冷却状态

**请求参数**:
```
openid: string  // URL参数，微信用户唯一标识
```

**请求示例**:
```bash
curl "https://your-domain.com/api/user/cooldown?openid=oU7Hw5FuW8gX9Z2K3mN4pQ6rS8tV"
```

**冷却中响应**:
```json
{
  "success": true,
  "data": {
    "is_cooling": true,
    "remaining_seconds": 8,
    "next_available_time": "2026-01-06T12:00:08.000Z"
  },
  "error": null,
  "timestamp": "2026-01-06T12:00:00.000Z"
}
```

**可用状态响应**:
```json
{
  "success": true,
  "data": {
    "is_cooling": false,
    "remaining_seconds": 0,
    "next_available_time": null
  },
  "error": null,
  "timestamp": "2026-01-06T12:00:00.000Z"
}
```

## 📊 数据接口

### 1. 运势分类统计

**接口地址**: `GET /api/data/categories`

**功能描述**: 获取各类运势的统计信息

**请求参数**: 无

**请求示例**:
```bash
curl https://your-domain.com/api/data/categories
```

**成功响应**:
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "name": "wealth",
        "display_name": "财运",
        "count": 10,
        "draw_count": 1850,
        "popularity": 0.21
      },
      {
        "name": "career",
        "display_name": "事业",
        "count": 10,
        "draw_count": 1650,
        "popularity": 0.19
      },
      {
        "name": "love",
        "display_name": "爱情",
        "count": 8,
        "draw_count": 1450,
        "popularity": 0.17
      },
      {
        "name": "health",
        "display_name": "健康",
        "count": 12,
        "draw_count": 1800,
        "popularity": 0.20
      },
      {
        "name": "study",
        "display_name": "学业",
        "count": 6,
        "draw_count": 1200,
        "popularity": 0.14
      },
      {
        "name": "general",
        "display_name": "综合",
        "count": 4,
        "draw_count": 800,
        "popularity": 0.09
      }
    ]
  },
  "error": null,
  "timestamp": "2026-01-06T12:00:00.000Z"
}
```

---

### 2. 热门运势排行

**接口地址**: `GET /api/data/popular`

**功能描述**: 获取最受欢迎的运势排行榜

**请求参数**:
```
limit: number  // 可选，返回数量，默认10，最大50
period: string // 可选，统计周期：today/week/month/all，默认all
```

**请求示例**:
```bash
curl "https://your-domain.com/api/data/popular?limit=5&period=week"
```

**成功响应**:
```json
{
  "success": true,
  "data": {
    "period": "week",
    "fortunes": [
      {
        "id": 23,
        "text": "新年新气象，事业蒸蒸日上！",
        "category": "career",
        "draw_count": 89,
        "rank": 1
      },
      {
        "id": 8,
        "text": "桃花朵朵开，爱情甜如蜜！",
        "category": "love",
        "draw_count": 76,
        "rank": 2
      },
      {
        "id": 15,
        "text": "2026年财运爆棚，金银满屋！",
        "category": "wealth",
        "draw_count": 68,
        "rank": 3
      }
    ]
  },
  "error": null,
  "timestamp": "2026-01-06T12:00:00.000Z"
}
```

## 🔐 错误码说明

### HTTP状态码
- `200 OK`: 请求成功
- `400 Bad Request`: 请求参数错误
- `401 Unauthorized`: 未授权访问
- `403 Forbidden`: 禁止访问
- `404 Not Found`: 资源不存在
- `429 Too Many Requests`: 请求过于频繁
- `500 Internal Server Error`: 服务器内部错误
- `503 Service Unavailable`: 服务不可用

### 业务错误码
```json
{
  "success": false,
  "error": "错误描述",
  "error_code": "ERROR_CODE",
  "timestamp": "2026-01-06T12:00:00.000Z"
}
```

| 错误码 | 描述 | 解决方案 |
|--------|------|----------|
| `MISSING_OPENID` | 缺少openid参数 | 检查请求参数 |
| `INVALID_OPENID` | openid格式无效 | 使用正确的微信openid |
| `COOLDOWN_ACTIVE` | 冷却期间，请稍后再试 | 等待冷却时间结束 |
| `NO_AVAILABLE_FORTUNE` | 没有可用的运势 | 用户已抽完所有运势 |
| `DATABASE_ERROR` | 数据库操作失败 | 联系技术支持 |
| `RATE_LIMIT_EXCEEDED` | 请求频率超限 | 降低请求频率 |
| `SYSTEM_MAINTENANCE` | 系统维护中 | 等待维护完成 |

## 🚀 SDK和示例代码

### JavaScript/TypeScript SDK

```typescript
// fortune-api-sdk.ts
class FortuneAPI {
  private baseURL: string;
  
  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }
  
  async drawFortune(openid: string): Promise<FortuneResponse> {
    const response = await fetch(`${this.baseURL}/api/fortune`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ openid }),
    });
    
    return response.json();
  }
  
  async getUserHistory(openid: string, limit = 10): Promise<HistoryResponse> {
    const response = await fetch(
      `${this.baseURL}/api/fortune/history?openid=${openid}&limit=${limit}`
    );
    
    return response.json();
  }
  
  async checkCooldown(openid: string): Promise<CooldownResponse> {
    const response = await fetch(
      `${this.baseURL}/api/user/cooldown?openid=${openid}`
    );
    
    return response.json();
  }
}

// 使用示例
const api = new FortuneAPI('https://your-domain.com');

// 抽签
const result = await api.drawFortune('user_openid');
if (result.success) {
  console.log('抽到运势:', result.data.text);
} else {
  console.log('抽签失败:', result.error);
}
```

### 微信小程序示例

```javascript
// 微信小程序中的使用
const API_BASE = 'https://your-domain.com/api';

// 抽签函数
function drawFortune(openid) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${API_BASE}/fortune`,
      method: 'POST',
      data: { openid },
      success: (res) => {
        if (res.statusCode === 200) {
          resolve(res.data);
        } else {
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      },
      fail: reject
    });
  });
}

// 使用示例
wx.login({
  success: async (loginRes) => {
    if (loginRes.code) {
      try {
        // 这里需要通过后端接口将code换取openid
        const openid = await getOpenidFromCode(loginRes.code);
        
        // 进行抽签
        const result = await drawFortune(openid);
        
        if (result.success) {
          // 显示运势结果
          wx.showModal({
            title: '您的新年运势',
            content: result.data.text,
            showCancel: false
          });
        } else {
          // 处理错误
          wx.showToast({
            title: result.error,
            icon: 'none'
          });
        }
      } catch (error) {
        console.error('抽签失败:', error);
        wx.showToast({
          title: '抽签失败，请重试',
          icon: 'none'
        });
      }
    }
  }
});
```

## 📝 API变更日志

### v1.0.0 (2026-01-06)
- ✨ 初始API版本发布
- 🎲 抽签核心接口
- 👤 用户相关接口
- 📊 统计数据接口
- 🏥 系统健康检查

### 未来版本计划
- **v1.1.0**: 添加用户收藏功能
- **v1.2.0**: 增加社交分享统计
- **v1.3.0**: 支持自定义运势内容
- **v2.0.0**: 多语言支持

## 🔧 开发工具

### Postman集合
我们提供了完整的Postman集合文件，包含所有API接口的示例请求：

```json
{
  "info": {
    "name": "微信小程序新年抽签API",
    "description": "完整的API接口集合"
  },
  "item": [
    {
      "name": "抽签接口",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"openid\": \"{{openid}}\"\n}"
        },
        "url": {
          "raw": "{{base_url}}/api/fortune",
          "host": ["{{base_url}}"],
          "path": ["api", "fortune"]
        }
      }
    }
  ],
  "variable": [
    {
      "key": "base_url",
      "value": "https://your-domain.com"
    },
    {
      "key": "openid",
      "value": "test_openid_123"
    }
  ]
}
```

### API测试脚本
```bash
#!/bin/bash
# api-test.sh - API接口测试脚本

BASE_URL="https://your-domain.com/api"
OPENID="test_openid_123"

echo "🧪 开始API测试..."

# 测试健康检查
echo "1. 测试健康检查接口"
curl -s "$BASE_URL/health" | jq .

# 测试抽签接口
echo "2. 测试抽签接口"
curl -s -X POST "$BASE_URL/fortune" \
  -H "Content-Type: application/json" \
  -d "{\"openid\":\"$OPENID\"}" | jq .

# 测试用户历史
echo "3. 测试用户历史接口"
curl -s "$BASE_URL/fortune/history?openid=$OPENID" | jq .

echo "✅ API测试完成"
```

---

**📡 API文档持续更新中，如有疑问请联系开发团队！**