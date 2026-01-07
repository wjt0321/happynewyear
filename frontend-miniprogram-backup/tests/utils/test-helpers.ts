// 测试辅助工具函数

import { mount, VueWrapper } from '@vue/test-utils'
import { createPinia } from 'pinia'
import type { ComponentPublicInstance } from 'vue'

// 创建测试用的Pinia实例
export function createTestPinia() {
  return createPinia()
}

// 挂载组件的辅助函数
export function mountComponent(component: any, options: any = {}) {
  const pinia = createTestPinia()
  
  return mount(component, {
    global: {
      plugins: [pinia],
      mocks: {
        $uni: global.uni,
        $wx: global.wx
      }
    },
    ...options
  })
}

// 等待异步操作完成
export async function flushPromises() {
  return new Promise(resolve => setTimeout(resolve, 0))
}

// 模拟延迟
export function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// 创建模拟的运势数据
export function createMockFortune(overrides: any = {}) {
  return {
    id: 1,
    text: '新年快乐，万事如意！',
    category: 'general',
    isNew: true,
    timestamp: Date.now(),
    ...overrides
  }
}

// 创建模拟的用户数据
export function createMockUser(overrides: any = {}) {
  return {
    openid: 'mock_openid_123',
    isLoggedIn: true,
    lastDrawTime: null,
    cooldownRemaining: 0,
    ...overrides
  }
}

// 创建模拟的API响应
export function createMockApiResponse(overrides: any = {}) {
  return {
    success: true,
    data: {
      id: 1,
      text: '新年快乐，万事如意！',
      isNew: true
    },
    ...overrides
  }
}

// 模拟uni.request的成功响应
export function mockUniRequestSuccess(data: any) {
  const mockUni = global.uni as any
  mockUni.request.mockImplementation((options: any) => {
    options.success?.({
      statusCode: 200,
      data
    })
  })
}

// 模拟uni.request的失败响应
export function mockUniRequestFail(error: any) {
  const mockUni = global.uni as any
  mockUni.request.mockImplementation((options: any) => {
    options.fail?.(error)
  })
}

// 模拟微信登录成功
export function mockWxLoginSuccess(code: string = 'mock_code_123') {
  const mockWx = global.wx as any
  mockWx.login.mockImplementation((options: any) => {
    options.success?.({ code })
  })
}

// 模拟微信登录失败
export function mockWxLoginFail(error: any) {
  const mockWx = global.wx as any
  mockWx.login.mockImplementation((options: any) => {
    options.fail?.(error)
  })
}

// 模拟本地存储
export function mockStorage(data: Record<string, any>) {
  const mockUni = global.uni as any
  mockUni.getStorageSync.mockImplementation((key: string) => {
    return data[key] || null
  })
}

// 清除所有模拟
export function clearAllMocks() {
  jest.clearAllMocks()
}

// 断言辅助函数
export const expect = {
  // 断言组件已渲染
  componentToBeRendered(wrapper: VueWrapper<ComponentPublicInstance>) {
    expect(wrapper.exists()).toBe(true)
  },
  
  // 断言文本内容
  textToContain(wrapper: VueWrapper<ComponentPublicInstance>, text: string) {
    expect(wrapper.text()).toContain(text)
  },
  
  // 断言元素存在
  elementToExist(wrapper: VueWrapper<ComponentPublicInstance>, selector: string) {
    expect(wrapper.find(selector).exists()).toBe(true)
  },
  
  // 断言API被调用
  apiToBeCalled(mockFn: jest.Mock, times: number = 1) {
    expect(mockFn).toHaveBeenCalledTimes(times)
  }
}

// 测试数据生成器
export class TestDataGenerator {
  static fortune(id: number = 1) {
    return createMockFortune({ id })
  }
  
  static user(openid: string = 'test_user') {
    return createMockUser({ openid })
  }
  
  static apiResponse(success: boolean = true) {
    return createMockApiResponse({ success })
  }
}