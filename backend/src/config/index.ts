import { AppConfig } from '../types';

// 应用配置
export const config: AppConfig = {
  port: parseInt(process.env.PORT || '5000'),
  database: {
    path: process.env.DB_PATH || './data/fortune.db',
    options: {
      verbose: process.env.NODE_ENV === 'development',
      fileMustExist: false
    }
  },
  cors: {
    origin: process.env.CORS_ORIGINS ? 
      process.env.CORS_ORIGINS.split(',') : [
        'https://servicewechat.com', // 微信小程序域名
        'https://ny.wxbfnnas.com',    // 生产环境域名
        'http://localhost:8080',     // 前端开发服务器
        'http://127.0.0.1:8080',     // 前端开发服务器
        'http://localhost:18081',    // NAS前端服务器
        'http://127.0.0.1:18081',    // NAS前端服务器
        'http://localhost:3000',     // 本地开发
        'http://127.0.0.1:3000',     // 本地开发
        'http://localhost:18080',    // NAS后端服务器
        'http://127.0.0.1:18080'     // NAS后端服务器
      ],
    credentials: true
  },
  cooldownSeconds: 10 // 抽签冷却时间（秒）
};

// 运势数据配置
export const FORTUNE_DATA = [
  { text: '2026年财运爆棚，金银满屋！', category: 'wealth' },
  { text: '新年新气象，事业蒸蒸日上！', category: 'career' },
  { text: '桃花朵朵开，爱情甜如蜜！', category: 'love' },
  { text: '身体健康，万事如意！', category: 'health' },
  { text: '学业有成，智慧满满！', category: 'study' },
  { text: '贵人相助，逢凶化吉！', category: 'general' },
  { text: '心想事成，好运连连！', category: 'general' },
  { text: '家庭和睦，幸福美满！', category: 'family' },
  { text: '投资有道，收益丰厚！', category: 'wealth' },
  { text: '升职加薪，前程似锦！', category: 'career' },
  { text: '真爱降临，缘分天定！', category: 'love' },
  { text: '精神饱满，活力四射！', category: 'health' },
  { text: '考试顺利，金榜题名！', category: 'study' },
  { text: '出行平安，一路顺风！', category: 'general' },
  { text: '朋友满天下，人缘极佳！', category: 'social' },
  { text: '创业成功，财源广进！', category: 'career' },
  { text: '偏财运旺，意外之喜！', category: 'wealth' },
  { text: '桃花运势，魅力无限！', category: 'love' },
  { text: '身心健康，长寿百岁！', category: 'health' },
  { text: '学习进步，智慧增长！', category: 'study' },
  { text: '马年大吉，万事顺心！', category: 'general' },
  { text: '家业兴旺，子孙满堂！', category: 'family' },
  { text: '正财偏财，双双到来！', category: 'wealth' },
  { text: '职场得意，领导赏识！', category: 'career' },
  { text: '姻缘美满，白头偕老！', category: 'love' },
  { text: '疾病远离，健康常伴！', category: 'health' },
  { text: '才华横溢，学有所成！', category: 'study' },
  { text: '吉星高照，福气满满！', category: 'general' },
  { text: '人际和谐，贵人扶持！', category: 'social' },
  { text: '财富自由，生活无忧！', category: 'wealth' },
  { text: '事业有成，名利双收！', category: 'career' },
  { text: '爱情甜蜜，幸福永恒！', category: 'love' },
  { text: '体魄强健，精力充沛！', category: 'health' },
  { text: '博学多才，前途光明！', category: 'study' },
  { text: '好运当头，诸事顺利！', category: 'general' },
  { text: '家和万事兴，团圆美满！', category: 'family' },
  { text: '横财就手，富贵逼人！', category: 'wealth' },
  { text: '步步高升，青云直上！', category: 'career' },
  { text: '情深意重，相伴终生！', category: 'love' },
  { text: '延年益寿，福寿双全！', category: 'health' },
  { text: '学富五车，才高八斗！', category: 'study' },
  { text: '紫气东来，祥瑞满门！', category: 'general' },
  { text: '左右逢源，人缘极佳！', category: 'social' },
  { text: '金玉满堂，富甲一方！', category: 'wealth' },
  { text: '功成名就，光宗耀祖！', category: 'career' },
  { text: '佳偶天成，琴瑟和鸣！', category: 'love' },
  { text: '身强体壮，百病不侵！', category: 'health' },
  { text: '满腹经纶，学贯中西！', category: 'study' },
  { text: '龙腾虎跃，大展宏图！', category: 'general' },
  { text: '四世同堂，其乐融融！', category: 'family' }
];