/**
 * 结果页组件单元测试
 * 测试运势显示、动画效果、分享功能和再次抽签逻辑
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { mount, VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ResultPage from '@/pages/result/result.vue'
import { useUserStore } from '@/stores/user'
import * as shareUtils from '@/utils/share'

// Mock 分享工具
jest.mock('@/utils/share', () => ({
  smartShare: jest.fn(),
  generateFortuneShareContent: jest.fn(),
  showShareResult: jest.fn()
}))

describe('结果页组件', () => {
  let wrapper: VueWrapper<any>
  let userStore: any
  let pinia: any

  beforeEach(() => {
    // 重置所有 mock
    jest.clearAllMocks()
    
    // 创建 Pinia 实例
    pinia = createPinia()
    setActivePinia(pinia)
    
    // 获取用户状态管理
    userStore = useUserStore()
    
    // Mock 用户状态
    userStore.cooldownRemaining = 0
    userStore.isLoggedIn = true
    userStore.openid = 'test_openid_123'
    
    // Mock getCurrentPages
    global.getCurrentPages = jest.fn(() => [
      {
        options: {
          fortuneId: '1',
          fortuneText: encodeURIComponent('2026年财运爆棚，金银满屋！'),
          isNew: 'true'
        }
      }
    ])
    
    // Mock document
    global.document = {
      querySelector: jest.fn()
    } as any
    
    // Mock uni API
    global.uni = {
      ...global.uni,
      showToast: jest.fn(),
      showModal: jest.fn(),
      navigateBack: jest.fn(),
      reLaunch: jest.fn()
    }
    
    // Mock 分享工具函数
    ;(shareUtils.generateFortuneShareContent as jest.Mock).mockReturnValue({
      title: '我抽到了新年好运势！',
      content: '2026年财运爆棚，金银满屋！',
      imageUrl: '/static/share-image.png',
      path: '/pages/index/index'
    })
    
    ;(shareUtils.smartShare as jest.Mock).mockResolvedValue({
      success: true,
      message: '分享成功！'
    })
    
    ;(shareUtils.showShareResult as jest.Mock).mockImplementation(() => {})
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
    jest.clearAllTimers()
  })

  describe('组件渲染', () => {
    it('应该正确渲染结果页面', async () => {
      wrapper = mount(ResultPage, {
        global: {
          plugins: [pinia]
        }
      })

      await wrapper.vm.$nextTick()

      // 检查页面基本结构
      expect(wrapper.find('.result-container').exists()).toBe(true)
      expect(wrapper.find('.result-background').exists()).toBe(true)
      expect(wrapper.find('.result-content').exists()).toBe(true)
    })

    it('应该显示正确的运势文本', async () => {
      wrapper = mount(ResultPage, {
        global: {
          plugins: [pinia]
        }
      })

      await wrapper.vm.$nextTick()

      // 检查运势文本显示
      const fortuneText = wrapper.find('.fortune-text')
      expect(fortuneText.exists()).toBe(true)
      expect(fortuneText.text()).toBe('2026年财运爆棚，金银满屋！')
    })

    it('应该显示新运势徽章', async () => {
      wrapper = mount(ResultPage, {
        global: {
          plugins: [pinia]
        }
      })

      await wrapper.vm.$nextTick()

      // 检查新运势徽章
      const newBadge = wrapper.find('.new-fortune-badge')
      expect(newBadge.exists()).toBe(true)
      expect(newBadge.find('.badge-text').text()).toBe('新运势')
    })

    it('应该显示操作按钮', async () => {
      wrapper = mount(ResultPage, {
        global: {
          plugins: [pinia]
        }
      })

      await wrapper.vm.$nextTick()

      // 检查分享按钮
      const shareButton = wrapper.find('.share-button')
      expect(shareButton.exists()).toBe(true)
      expect(shareButton.text()).toContain('分享好友')

      // 检查再次抽签按钮
      const drawAgainButton = wrapper.find('.draw-again-button')
      expect(drawAgainButton.exists()).toBe(true)
      expect(drawAgainButton.text()).toContain('再抽一次')
    })
  })

  describe('动画效果', () => {
    it('应该渲染背景动画元素', async () => {
      wrapper = mount(ResultPage, {
        global: {
          plugins: [pinia]
        }
      })

      await wrapper.vm.$nextTick()

      // 检查金光射线
      const goldenRays = wrapper.find('.golden-rays')
      expect(goldenRays.exists()).toBe(true)
      expect(goldenRays.findAll('.ray')).toHaveLength(8)

      // 检查庆祝粒子
      const particles = wrapper.find('.celebration-particles')
      expect(particles.exists()).toBe(true)
      expect(particles.findAll('.particle')).toHaveLength(20)

      // 检查浮动装饰
      const decorations = wrapper.find('.floating-decorations')
      expect(decorations.exists()).toBe(true)
      expect(decorations.findAll('.decoration')).toHaveLength(6)
    })

    it('应该为运势卡片添加发光效果', async () => {
      wrapper = mount(ResultPage, {
        global: {
          plugins: [pinia]
        }
      })

      await wrapper.vm.$nextTick()

      // 检查运势卡片发光效果
      const fortuneCard = wrapper.find('.fortune-card')
      expect(fortuneCard.exists()).toBe(true)
      expect(fortuneCard.classes()).toContain('card-glow')

      // 检查光环效果
      const cardAura = wrapper.find('.card-aura')
      expect(cardAura.exists()).toBe(true)
    })

    it('应该显示闪烁装饰符号', async () => {
      wrapper = mount(ResultPage, {
        global: {
          plugins: [pinia]
        }
      })

      await wrapper.vm.$nextTick()

      // 检查装饰符号
      const sparkles = wrapper.findAll('.decoration-symbol')
      expect(sparkles).toHaveLength(3)
      
      // 检查不同的闪烁延迟
      expect(sparkles[0].classes()).toContain('sparkle-1')
      expect(sparkles[1].classes()).toContain('sparkle-2')
      expect(sparkles[2].classes()).toContain('sparkle-3')
    })
  })

  describe('分享功能', () => {
    it('应该正确处理分享点击', async () => {
      wrapper = mount(ResultPage, {
        global: {
          plugins: [pinia]
        }
      })

      await wrapper.vm.$nextTick()

      // 点击分享按钮
      const shareButton = wrapper.find('.share-button')
      await shareButton.trigger('click')

      // 验证分享工具函数被调用
      expect(shareUtils.generateFortuneShareContent).toHaveBeenCalledWith(
        '2026年财运爆棚，金银满屋！',
        true
      )
      expect(shareUtils.smartShare).toHaveBeenCalled()
      expect(shareUtils.showShareResult).toHaveBeenCalledWith({
        success: true,
        message: '分享成功！'
      })
    })

    it('应该处理分享失败情况', async () => {
      // Mock 分享失败
      ;(shareUtils.smartShare as jest.Mock).mockRejectedValue(new Error('分享失败'))

      wrapper = mount(ResultPage, {
        global: {
          plugins: [pinia]
        }
      })

      await wrapper.vm.$nextTick()

      // 点击分享按钮
      const shareButton = wrapper.find('.share-button')
      await shareButton.trigger('click')

      // 等待异步操作完成
      await new Promise(resolve => setTimeout(resolve, 0))

      // 验证错误提示
      expect(global.uni.showToast).toHaveBeenCalledWith({
        title: '分享失败，请重试',
        icon: 'none',
        duration: 2000
      })
    })

    it('应该为新运势生成正确的分享内容', async () => {
      wrapper = mount(ResultPage, {
        global: {
          plugins: [pinia]
        }
      })

      await wrapper.vm.$nextTick()

      // 点击分享按钮
      const shareButton = wrapper.find('.share-button')
      await shareButton.trigger('click')

      // 验证分享内容生成
      expect(shareUtils.generateFortuneShareContent).toHaveBeenCalledWith(
        '2026年财运爆棚，金银满屋！',
        true // isNew = true
      )
    })
  })

  describe('再次抽签功能', () => {
    it('应该在无冷却时间时正常处理再次抽签', async () => {
      // 设置无冷却时间
      userStore.cooldownRemaining = 0

      wrapper = mount(ResultPage, {
        global: {
          plugins: [pinia]
        }
      })

      await wrapper.vm.$nextTick()

      // Mock 用户确认对话框
      global.uni.showModal = jest.fn().mockImplementation((options: any) => {
        options.success({ confirm: true })
      })

      // Mock 返回成功
      global.uni.navigateBack = jest.fn().mockImplementation((options: any) => {
        options.success()
      })

      // 点击再次抽签按钮
      const drawAgainButton = wrapper.find('.draw-again-button')
      await drawAgainButton.trigger('click')

      // 验证确认对话框
      expect(global.uni.showModal).toHaveBeenCalledWith({
        title: '再抽一次',
        content: '确定要返回首页再抽一次吗？',
        confirmText: '确定',
        cancelText: '取消',
        success: expect.any(Function)
      })

      // 验证页面返回
      expect(global.uni.navigateBack).toHaveBeenCalledWith({
        delta: 1,
        success: expect.any(Function),
        fail: expect.any(Function)
      })
    })

    it('应该在冷却期间阻止再次抽签', async () => {
      // 创建一个简化的测试，直接调用组件方法
      wrapper = mount(ResultPage, {
        global: {
          plugins: [pinia]
        }
      })

      await wrapper.vm.$nextTick()

      // 直接设置组件的冷却状态
      wrapper.vm.userStore.cooldownRemaining = 5

      // 强制更新组件
      await wrapper.vm.$forceUpdate()
      await wrapper.vm.$nextTick()

      // 点击再次抽签按钮
      const drawAgainButton = wrapper.find('.draw-again-button')
      await drawAgainButton.trigger('click')

      // 验证冷却提示被调用
      expect(global.uni.showModal).toHaveBeenCalled()
      
      // 验证调用参数包含冷却信息
      const modalCall = (global.uni.showModal as jest.Mock).mock.calls[0][0]
      expect(modalCall.title).toContain('抽签')
      expect(modalCall.content).toContain('秒')

      // 验证不会触发页面返回
      expect(global.uni.navigateBack).not.toHaveBeenCalled()
    })

    it('应该显示冷却倒计时', async () => {
      // 设置冷却时间
      Object.defineProperty(userStore, 'cooldownRemaining', {
        get: () => 8,
        configurable: true
      })

      wrapper = mount(ResultPage, {
        global: {
          plugins: [pinia]
        }
      })

      await wrapper.vm.$nextTick()

      // 检查按钮状态
      const drawAgainButton = wrapper.find('.draw-again-button')
      expect(drawAgainButton.classes()).toContain('disabled')
      expect(drawAgainButton.attributes('disabled')).toBeDefined()

      // 检查冷却倒计时显示
      const cooldownContent = wrapper.find('.cooldown-content')
      expect(cooldownContent.exists()).toBe(true)
      
      const cooldownNumber = wrapper.find('.cooldown-number')
      expect(cooldownNumber.text()).toBe('8')
      
      const cooldownText = wrapper.find('.cooldown-text')
      expect(cooldownText.text()).toBe('秒后可再抽')
    })

    it('应该在返回失败时尝试重定向', async () => {
      // 设置无冷却时间
      userStore.cooldownRemaining = 0

      wrapper = mount(ResultPage, {
        global: {
          plugins: [pinia]
        }
      })

      await wrapper.vm.$nextTick()

      // Mock 用户确认对话框
      global.uni.showModal = jest.fn().mockImplementation((options: any) => {
        options.success({ confirm: true })
      })

      // Mock 返回失败
      global.uni.navigateBack = jest.fn().mockImplementation((options: any) => {
        options.fail(new Error('返回失败'))
      })

      // 点击再次抽签按钮
      const drawAgainButton = wrapper.find('.draw-again-button')
      await drawAgainButton.trigger('click')

      // 验证重定向调用
      expect(global.uni.reLaunch).toHaveBeenCalledWith({
        url: '/pages/index/index'
      })
    })
  })

  describe('页面参数处理', () => {
    it('应该正确解析页面参数', async () => {
      // Mock 不同的页面参数
      global.getCurrentPages = jest.fn(() => [
        {
          options: {
            fortuneId: '42',
            fortuneText: encodeURIComponent('龙年大吉，万事如意！'),
            isNew: 'false'
          }
        }
      ])

      wrapper = mount(ResultPage, {
        global: {
          plugins: [pinia]
        }
      })

      await wrapper.vm.$nextTick()

      // 验证参数解析
      expect(wrapper.vm.fortuneId).toBe(42)
      expect(wrapper.vm.fortuneText).toBe('龙年大吉，万事如意！')
      expect(wrapper.vm.isNew).toBe(false)

      // 验证运势文本显示
      const fortuneText = wrapper.find('.fortune-text')
      expect(fortuneText.text()).toBe('龙年大吉，万事如意！')

      // 验证新运势徽章不显示
      const newBadge = wrapper.find('.new-fortune-badge')
      expect(newBadge.exists()).toBe(false)
    })

    it('应该处理缺失的页面参数', async () => {
      // Mock 空的页面参数
      global.getCurrentPages = jest.fn(() => [
        {
          options: {}
        }
      ])

      wrapper = mount(ResultPage, {
        global: {
          plugins: [pinia]
        }
      })

      await wrapper.vm.$nextTick()

      // 验证默认值
      expect(wrapper.vm.fortuneId).toBe(0)
      expect(wrapper.vm.fortuneText).toBe('')
      expect(wrapper.vm.isNew).toBe(false)
    })
  })

  describe('庆祝动画', () => {
    it('应该为新运势触发庆祝动画', async () => {
      // Mock DOM 查询
      const mockBadge = { classList: { add: jest.fn() } }
      const mockQuerySelector = jest.fn().mockReturnValue(mockBadge)
      global.document.querySelector = mockQuerySelector

      wrapper = mount(ResultPage, {
        global: {
          plugins: [pinia]
        }
      })

      await wrapper.vm.$nextTick()

      // 等待动画延迟
      await new Promise(resolve => setTimeout(resolve, 1100))

      // 验证动画触发
      expect(mockQuerySelector).toHaveBeenCalledWith('.new-fortune-badge')
      expect(mockBadge.classList.add).toHaveBeenCalledWith('show')
    })

    it('应该为非新运势跳过庆祝动画', async () => {
      // Mock 非新运势参数
      global.getCurrentPages = jest.fn(() => [
        {
          options: {
            fortuneId: '1',
            fortuneText: encodeURIComponent('测试运势'),
            isNew: 'false'
          }
        }
      ])

      // Mock DOM 查询
      const mockQuerySelector = jest.fn()
      global.document.querySelector = mockQuerySelector

      wrapper = mount(ResultPage, {
        global: {
          plugins: [pinia]
        }
      })

      await wrapper.vm.$nextTick()

      // 等待可能的动画延迟
      await new Promise(resolve => setTimeout(resolve, 1100))

      // 验证不触发动画
      expect(mockQuerySelector).not.toHaveBeenCalled()
    })
  })
})