// 微信小程序类型定义文件
// 避免与现有类型定义冲突

declare namespace WeChatMiniProgram {
  interface LoginResponse {
    code: string
    errMsg: string
  }
  
  interface UserInfo {
    nickName: string
    avatarUrl: string
    gender: number
    country: string
    province: string
    city: string
  }
  
  interface UserProfileResponse {
    userInfo: UserInfo
    rawData: string
    signature: string
    encryptedData: string
    iv: string
    errMsg: string
  }
}

// 微信API接口定义（避免全局声明冲突）
interface WxAPI {
  login(options: {
    success: (res: WeChatMiniProgram.LoginResponse) => void
    fail?: (err: any) => void
  }): void
  
  getUserProfile(options: {
    desc: string
    success: (res: WeChatMiniProgram.UserProfileResponse) => void
    fail?: (err: any) => void
  }): void
  
  checkSession(options: {
    success: () => void
    fail: () => void
  }): void
}

// 扩展全局类型（仅在需要时）
declare global {
  interface Window {
    wx?: WxAPI
  }
}