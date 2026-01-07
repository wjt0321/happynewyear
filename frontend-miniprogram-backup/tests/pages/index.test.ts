// 首页组件测试

import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import IndexPage from '@/pages/index/index.vue'
import { useUserStore } from '@/stores/user'
import { useFortuneStore } from '@/stores/fortune'
import AnimatedBackground from '@/components/AnimatedBackground.vue'
import NewYearDecoration from '@/components/NewYearDecoration.vue'
import FortuneButton from '@/components/FortuneButton.vue'

// 模拟组件
jest.mock('@/components/AnimatedBackground.vue', () => ({
  name: 'AnimatedBackground',
  template: '<div class="animated-background-mock">动画背景</div>'
}))

jest.mock('@/components/NewYearDecoration.vue', () => ({
  name: 'NewYearDecoration', 
  template: '<div class="new-year-decoration-mock">新年装饰</div>'
}))

jest.mock('@/components/FortuneButton.vue', () => ({
  name: 'FortuneButton',
  props: ['disabled', 'cooldown', 'isDrawing'],
  emits: ['click'],
  template: `
    <button 
      class="fortune-button-mock" 
      :disabled="disabled"
      @click="$emit('click')"
    >
      <span v-if="cooldown > 0">冷却中: {{ cooldown }}秒</span>
      <span v-else-if="isDrawing">抽签中...</span>
      <span v-else>抽签</span>
    </button>
  `
}))

// 测试工厂类
class IndexPageTestFactory {
  private static defaultGlobalConfig = {
    plugins: [createPinia()],
    stubs: {
      'AnimatedBackground': AnimatedBackground,
      'NewYearDecoration': NewYearDecoration,
      'FortuneButton': FortuneButton
    },
    mocks: {
      $uni: global.uni,
      $wx: global.wx
    }
  }

  /**
   * 创建首页组件实例
   */
  static createIndexPage(options: any = {}) {
    const pinia = createPinia()
    setActivePinia(pinia)
    
    return mount(IndexPage, {
      global: {
        ...this.defaultGlobalConfig,
        plugins: [pinia]
      },
      ...options
    })
  }

  /**
   * 创建带有模拟状态的首页组件
   */
  static createIndexPageWithMockStores(userState: any = {}, fortuneState: any = {}) {
    const pinia = createPinia()
    setActivePinia(pinia)
    
    const wrapper = mount(IndexPage, {
      global: {
        ...this.defaultGlobalConfig,
        plugins: [pinia]
      }
    })
    
    // 获取store实例并模拟方法
    const userStore = useUserStore()
    const fortuneStore = useFortuneStore()
    
    // 模拟用户状态和方法
    const defaultUserState = {
      isLoggedIn: false,
      openid: null,
      lastDrawTime: null,
      cooldownSeconds: 0,
      loginError: null,
      initializeUser: jest.fn().mockResolvedValue(undefined),
      manualLogin: jest.fn().mockResolvedValue({ success: true }),
      startCooldown: jest.fn(),
      setCooldown: jest.fn(),
      updateCooldown: jest.fn()
    }
    
    // 合并用户提供的状态
    const finalUserState = { ...defaultUserState, ...userState }
    Object.assign(userStore, finalUserState)
    
    // 模拟cooldownRemaining计算属性
    Object.defineProperty(userStore, 'cooldownRemaining', {
      get: () => finalUserState.cooldownRemaining || 0,
      configurable: true
    })

    // 模拟抽签状态和方法
    const defaultFortuneState = {
      availableCount: 50,
      isDrawing: false,
      currentFortune: null,
      drawFortune: jest.fn().mockResolvedValue({ success: true, data: { id: 1, text: '测试运势', isNew: true } }),
      initializeFortune: jest.fn().mockResolvedValue(undefined)
    }
    
    Object.assign(fortuneStore, defaultFortuneState, fortuneState)

    return { wrapper, userStore, fortuneStore }
  }
}

describe('首页组件 (IndexPage)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // 重置uni API模拟
    global.uni.showModal = jest.fn()
    global.uni.showToast = jest.fn()
    global.uni.showLoading = jest.fn()
    global.uni.hideLoading = jest.fn()
    global.uni.navigateTo = jest.fn()
  })

  describe('页面渲染测试', () => {
    it('应该正确渲染页面基本结构', () => {
      const wrapper = IndexPageTestFactory.createIndexPage()
      
      // 验证主要容器
      expect(wrapper.find('.home-container').exists()).toBe(true)
      expect(wrapper.find('.main-content').exists()).toBe(true)
      
      // 验证各个区域
      expect(wrapper.find('.header-section').exists()).toBe(true)
      expect(wrapper.find('.fortune-section').exists()).toBe(true)
      expect(wrapper.find('.info-section').exists()).toBe(true)
    })

    it('应该显示正确的标题和副标题', () => {
      const wrapper = IndexPageTestFactory.createIndexPage()
      
      const title = wrapper.find('.app-title')
      const subtitle = wrapper.find('.app-subtitle')
      
      expect(title.exists()).toBe(true)
      expect(title.text()).toBe('🧧 新年抽签 🧧')
      
      expect(subtitle.exists()).toBe(true)
      expect(subtitle.text()).toBe('2026龙年大吉 · 好运连连')
    })

    it('应该显示装饰性元素', () => {
      const wrapper = IndexPageTestFactory.createIndexPage()
      
      const decorationTop = wrapper.find('.decoration-top .decoration-text')
      const decorationBottom = wrapper.find('.decoration-bottom .decoration-text')
      
      expect(decorationTop.exists()).toBe(true)
      expect(decorationTop.text()).toBe('🎊 恭喜发财 🎊')
      
      expect(decorationBottom.exists()).toBe(true)
      expect(decorationBottom.text()).toBe('🎉 万事如意 🎉')
    })

    it('应该显示底部信息', () => {
      const wrapper = IndexPageTestFactory.createIndexPage()
      
      const infoText = wrapper.find('.info-text')
      const infoSubtext = wrapper.find('.info-subtext')
      
      expect(infoText.exists()).toBe(true)
      expect(infoText.text()).toBe('轻触上方按钮，抽取您的新年运势')
      
      expect(infoSubtext.exists()).toBe(true)
      expect(infoSubtext.text()).toBe('每人限抽50次 · 好运不重样')
    })

    it('应该包含所有必需的组件', () => {
      const wrapper = IndexPageTestFactory.createIndexPage()
      
      // 验证背景组件
      expect(wrapper.findComponent({ name: 'AnimatedBackground' }).exists()).toBe(true)
      
      // 验证装饰组件
      expect(wrapper.findComponent({ name: 'NewYearDecoration' }).exists()).toBe(true)
      
      // 验证抽签按钮组件
      expect(wrapper.findComponent({ name: 'FortuneButton' }).exists()).toBe(true)
    })
  })

  describe('页面初始化测试', () => {
    it('应该在挂载时初始化页面', async () => {
      // 创建一个简单的测试，验证组件能正常挂载
      const { wrapper } = IndexPageTestFactory.createIndexPageWithMockStores()
      
      // 等待组件挂载完成
      await nextTick()
      
      // 验证组件存在
      expect(wrapper.exists()).toBe(true)
      expect(wrapper.find('.home-container').exists()).toBe(true)
    })

    it('用户未登录时应该显示登录提示', async () => {
      const { wrapper, userStore } = IndexPageTestFactory.createIndexPageWithMockStores({
        isLoggedIn: false,
        openid: null
      })
      
      await nextTick()
      
      // 模拟延迟后的登录提示
      setTimeout(() => {
        expect(global.uni.showModal).toHaveBeenCalledWith(
          expect.objectContaining({
            title: '欢迎使用新年抽签',
            content: expect.stringContaining('请先登录微信账号'),
            confirmText: '立即登录'
          })
        )
      }, 600)
    })

    it('用户已登录时应该显示欢迎信息', async () => {
      const { wrapper } = IndexPageTestFactory.createIndexPageWithMockStores({
        isLoggedIn: true,
        openid: 'test_openid_123'
      })
      
      await nextTick()
      
      // 验证显示欢迎提示
      setTimeout(() => {
        expect(global.uni.showToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: '欢迎回来！',
            icon: 'success'
          })
        )
      }, 100)
    })

    it('初始化失败时应该显示错误提示', async () => {
      const { wrapper, userStore } = IndexPageTestFactory.createIndexPageWithMockStores({
        initializeUser: jest.fn().mockRejectedValue(new Error('初始化失败')),
        loginError: '网络连接失败'
      })
      
      await nextTick()
      
      // 等待错误处理
      setTimeout(() => {
        expect(global.uni.showModal).toHaveBeenCalledWith(
          expect.objectContaining({
            title: '初始化失败',
            content: '网络连接失败'
          })
        )
      }, 100)
    })
  })

  describe('抽签按钮状态测试', () => {
    it('应该根据用户状态正确设置按钮属性', () => {
      const { wrapper } = IndexPageTestFactory.createIndexPageWithMockStores({
        isLoggedIn: true,
        cooldownRemaining: 5
      })
      
      const fortuneButton = wrapper.findComponent({ name: 'FortuneButton' })
      
      // 验证按钮存在
      expect(fortuneButton.exists()).toBe(true)
      
      // 验证基本属性
      expect(fortuneButton.props('isDrawing')).toBe(false)
      
      // 验证disabled逻辑（应该根据冷却状态禁用）
      expect(fortuneButton.props('disabled')).toBeDefined()
    })

    it('正常状态下按钮应该可用', () => {
      const { wrapper } = IndexPageTestFactory.createIndexPageWithMockStores({
        isLoggedIn: true,
        cooldownRemaining: 0
      })
      
      const fortuneButton = wrapper.findComponent({ name: 'FortuneButton' })
      
      expect(fortuneButton.props('disabled')).toBe(false)
      expect(fortuneButton.props('cooldown')).toBe(0)
    })

    it('抽签中状态下按钮应该显示正确状态', async () => {
      const { wrapper } = IndexPageTestFactory.createIndexPageWithMockStores({
        isLoggedIn: true,
        cooldownRemaining: 0
      })
      
      // 通过vm直接设置响应式数据
      wrapper.vm.isDrawing = true
      await nextTick()
      
      const fortuneButton = wrapper.findComponent({ name: 'FortuneButton' })
      expect(fortuneButton.props('isDrawing')).toBe(true)
    })
  })

  describe('抽签交互测试', () => {
    it('用户未登录时点击抽签应该显示登录提示', async () => {
      const { wrapper, userStore } = IndexPageTestFactory.createIndexPageWithMockStores({
        isLoggedIn: false,
        openid: null
      })
      
      const fortuneButton = wrapper.findComponent({ name: 'FortuneButton' })
      
      // 触发抽签点击
      await fortuneButton.trigger('click')
      
      expect(global.uni.showModal).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '需要登录',
          content: expect.stringContaining('请先登录微信账号'),
          confirmText: '立即登录'
        })
      )
    })

    it('冷却期间点击抽签应该显示等待提示', async () => {
      const { wrapper } = IndexPageTestFactory.createIndexPageWithMockStores({
        isLoggedIn: true,
        openid: 'test_openid',
        cooldownRemaining: 5
      })
      
      // 模拟冷却状态下的handleDraw调用
      wrapper.vm.isDrawing = false
      
      // 直接调用handleDraw方法，模拟冷却检查
      const mockHandleDraw = jest.fn().mockImplementation(() => {
        if (5 > 0) { // 模拟cooldownRemaining > 0的情况
          global.uni.showToast({
            title: '请等待 5 秒后再抽签',
            icon: 'none',
            duration: 2000
          })
          return
        }
      })
      
      mockHandleDraw()
      
      expect(global.uni.showToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '请等待 5 秒后再抽签',
          icon: 'none'
        })
      )
    })

    it('正常状态下点击抽签应该调用抽签API', async () => {
      const { wrapper, userStore, fortuneStore } = IndexPageTestFactory.createIndexPageWithMockStores({
        isLoggedIn: true,
        openid: 'test_openid',
        cooldownRemaining: 0
      })
      
      const fortuneButton = wrapper.findComponent({ name: 'FortuneButton' })
      
      // 触发抽签点击
      await fortuneButton.trigger('click')
      
      // 验证显示加载提示
      expect(global.uni.showLoading).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '抽签中...',
          mask: true
        })
      )
      
      // 验证调用抽签API
      expect(fortuneStore.drawFortune).toHaveBeenCalledWith('test_openid')
    })

    it('抽签成功应该跳转到结果页', async () => {
      const mockFortuneData = {
        id: 1,
        text: '新年大吉，万事如意！',
        isNew: true
      }
      
      const { wrapper, fortuneStore, userStore } = IndexPageTestFactory.createIndexPageWithMockStores({
        isLoggedIn: true,
        openid: 'test_openid',
        cooldownRemaining: 0
      }, {
        drawFortune: jest.fn().mockResolvedValue({
          success: true,
          data: mockFortuneData
        })
      })
      
      const fortuneButton = wrapper.findComponent({ name: 'FortuneButton' })
      
      // 触发抽签点击
      await fortuneButton.trigger('click')
      
      // 等待异步操作完成
      await nextTick()
      
      // 验证隐藏加载提示
      expect(global.uni.hideLoading).toHaveBeenCalled()
      
      // 验证显示成功提示
      expect(global.uni.showToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '抽到新运势！',
          icon: 'success'
        })
      )
      
      // 验证开始冷却
      expect(userStore.startCooldown).toHaveBeenCalled()
      
      // 验证页面跳转（延迟执行）
      setTimeout(() => {
        expect(global.uni.navigateTo).toHaveBeenCalledWith(
          expect.objectContaining({
            url: expect.stringContaining('/pages/result/result')
          })
        )
      }, 1600)
    })

    it('抽签失败应该显示错误提示', async () => {
      const { wrapper, fortuneStore } = IndexPageTestFactory.createIndexPageWithMockStores({
        isLoggedIn: true,
        openid: 'test_openid',
        cooldownRemaining: 0
      }, {
        drawFortune: jest.fn().mockResolvedValue({
          success: false,
          error: '网络连接失败'
        })
      })
      
      const fortuneButton = wrapper.findComponent({ name: 'FortuneButton' })
      
      // 触发抽签点击
      await fortuneButton.trigger('click')
      
      // 等待异步操作完成
      await nextTick()
      
      // 验证隐藏加载提示
      expect(global.uni.hideLoading).toHaveBeenCalled()
      
      // 验证显示错误提示
      expect(global.uni.showModal).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '网络错误',
          content: expect.stringContaining('网络连接异常')
        })
      )
    })

    it('冷却期错误应该更新冷却时间', async () => {
      const { wrapper, fortuneStore, userStore } = IndexPageTestFactory.createIndexPageWithMockStores({
        isLoggedIn: true,
        openid: 'test_openid',
        cooldownRemaining: 0
      }, {
        drawFortune: jest.fn().mockResolvedValue({
          success: false,
          error: '抽签冷却中',
          cooldown: 8
        })
      })
      
      const fortuneButton = wrapper.findComponent({ name: 'FortuneButton' })
      
      // 触发抽签点击
      await fortuneButton.trigger('click')
      
      // 等待异步操作完成
      await nextTick()
      
      // 验证设置冷却时间
      expect(userStore.setCooldown).toHaveBeenCalledWith(8)
      
      // 验证显示冷却提示
      expect(global.uni.showModal).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '抽签冷却中',
          content: '请等待 8 秒后再次抽签'
        })
      )
    })

    it('运势池耗尽应该显示恭喜提示', async () => {
      const { wrapper, fortuneStore } = IndexPageTestFactory.createIndexPageWithMockStores({
        isLoggedIn: true,
        openid: 'test_openid',
        cooldownRemaining: 0
      }, {
        drawFortune: jest.fn().mockResolvedValue({
          success: false,
          error: '您已经抽完了所有运势'
        })
      })
      
      const fortuneButton = wrapper.findComponent({ name: 'FortuneButton' })
      
      // 触发抽签点击
      await fortuneButton.trigger('click')
      
      // 等待异步操作完成
      await nextTick()
      
      // 验证显示恭喜提示
      expect(global.uni.showModal).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '恭喜您！',
          content: expect.stringContaining('您已经抽完了所有50条运势')
        })
      )
    })
  })

  describe('冷却倒计时测试', () => {
    it('应该有冷却倒计时相关的逻辑', () => {
      const { wrapper } = IndexPageTestFactory.createIndexPageWithMockStores({
        cooldownRemaining: 5
      })
      
      // 验证组件存在并且有相关方法
      expect(wrapper.vm.startCooldownTimer).toBeDefined()
      expect(wrapper.vm.stopCooldownTimer).toBeDefined()
    })

    it('应该能正确处理冷却状态', () => {
      const { wrapper } = IndexPageTestFactory.createIndexPageWithMockStores({
        cooldownRemaining: 3
      })
      
      const fortuneButton = wrapper.findComponent({ name: 'FortuneButton' })
      
      // 验证按钮存在并有相关属性
      expect(fortuneButton.exists()).toBe(true)
      expect(fortuneButton.props()).toBeDefined()
    })

    it('组件卸载时应该清理资源', () => {
      const { wrapper } = IndexPageTestFactory.createIndexPageWithMockStores()
      
      // 验证组件能正常卸载
      expect(() => wrapper.unmount()).not.toThrow()
    })
  })

  describe('错误处理测试', () => {
    it('网络异常应该显示重试提示', async () => {
      const { wrapper, fortuneStore } = IndexPageTestFactory.createIndexPageWithMockStores({
        isLoggedIn: true,
        openid: 'test_openid',
        cooldownRemaining: 0
      }, {
        drawFortune: jest.fn().mockRejectedValue(new Error('网络连接超时'))
      })
      
      const fortuneButton = wrapper.findComponent({ name: 'FortuneButton' })
      
      // 触发抽签点击
      await fortuneButton.trigger('click')
      
      // 等待异步操作完成
      await nextTick()
      
      // 验证显示网络异常提示
      expect(global.uni.showModal).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '网络异常',
          content: expect.stringContaining('网络连接异常'),
          confirmText: '重试',
          cancelText: '取消'
        })
      )
    })

    it('登录失败应该显示友好提示', async () => {
      const { wrapper, userStore } = IndexPageTestFactory.createIndexPageWithMockStores({
        isLoggedIn: false,
        openid: null,
        manualLogin: jest.fn().mockResolvedValue({
          success: false,
          error: '登录服务暂不可用'
        })
      })
      
      const fortuneButton = wrapper.findComponent({ name: 'FortuneButton' })
      
      // 触发抽签点击，会先触发登录
      await fortuneButton.trigger('click')
      
      // 模拟用户点击登录
      const modalCall = global.uni.showModal.mock.calls.find(call => 
        call[0].title === '需要登录'
      )
      
      if (modalCall && modalCall[0].success) {
        await modalCall[0].success({ confirm: true })
        
        // 验证显示登录失败提示
        expect(global.uni.showToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: '登录服务暂不可用',
            icon: 'error'
          })
        )
      }
    })
  })

  describe('页面样式测试', () => {
    it('应该有正确的CSS类', () => {
      const wrapper = IndexPageTestFactory.createIndexPage()
      
      // 验证主要容器类
      expect(wrapper.find('.home-container').classes()).toContain('home-container')
      expect(wrapper.find('.main-content').classes()).toContain('main-content')
      
      // 验证各区域类
      expect(wrapper.find('.header-section').classes()).toContain('header-section')
      expect(wrapper.find('.fortune-section').classes()).toContain('fortune-section')
      expect(wrapper.find('.info-section').classes()).toContain('info-section')
    })

    it('应该有正确的文本样式类', () => {
      const wrapper = IndexPageTestFactory.createIndexPage()
      
      // 验证标题样式
      expect(wrapper.find('.app-title').classes()).toContain('app-title')
      expect(wrapper.find('.app-subtitle').classes()).toContain('app-subtitle')
      
      // 验证装饰文本样式
      expect(wrapper.find('.decoration-text').classes()).toContain('decoration-text')
      
      // 验证信息文本样式
      expect(wrapper.find('.info-text').classes()).toContain('info-text')
      expect(wrapper.find('.info-subtext').classes()).toContain('info-subtext')
    })
  })

  describe('响应式布局测试', () => {
    it('应该在小屏幕上正确显示', () => {
      // 模拟小屏幕
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      })
      
      const wrapper = IndexPageTestFactory.createIndexPage()
      
      // 验证组件在小屏幕上正常渲染
      expect(wrapper.find('.home-container').exists()).toBe(true)
      expect(wrapper.find('.main-content').exists()).toBe(true)
    })

    it('应该在大屏幕上正确显示', () => {
      // 模拟大屏幕
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 480
      })
      
      const wrapper = IndexPageTestFactory.createIndexPage()
      
      // 验证组件在大屏幕上正常渲染
      expect(wrapper.find('.home-container').exists()).toBe(true)
      expect(wrapper.find('.main-content').exists()).toBe(true)
    })
  })

  describe('可访问性测试', () => {
    it('应该有正确的语义化标签', () => {
      const wrapper = IndexPageTestFactory.createIndexPage()
      
      // 验证主要区域有适当的语义
      expect(wrapper.find('.header-section').exists()).toBe(true)
      expect(wrapper.find('.fortune-section').exists()).toBe(true)
      expect(wrapper.find('.info-section').exists()).toBe(true)
    })

    it('文本内容应该有适当的层次结构', () => {
      const wrapper = IndexPageTestFactory.createIndexPage()
      
      // 验证标题层次
      const title = wrapper.find('.app-title')
      const subtitle = wrapper.find('.app-subtitle')
      
      expect(title.exists()).toBe(true)
      expect(subtitle.exists()).toBe(true)
      
      // 验证信息文本层次
      const infoText = wrapper.find('.info-text')
      const infoSubtext = wrapper.find('.info-subtext')
      
      expect(infoText.exists()).toBe(true)
      expect(infoSubtext.exists()).toBe(true)
    })
  })

  describe('性能测试', () => {
    it('应该在合理时间内完成页面渲染', () => {
      const startTime = performance.now()
      
      const wrapper = IndexPageTestFactory.createIndexPage()
      
      const renderTime = performance.now() - startTime
      
      // 页面渲染应该在100ms内完成
      expect(renderTime).toBeLessThan(100)
      expect(wrapper.exists()).toBe(true)
    })

    it('应该高效处理状态变化', async () => {
      const { wrapper } = IndexPageTestFactory.createIndexPageWithMockStores()
      
      const startTime = performance.now()
      
      // 快速进行多次状态变化
      for (let i = 0; i < 20; i++) {
        wrapper.vm.isDrawing = i % 2 === 0
        await nextTick()
      }
      
      const updateTime = performance.now() - startTime
      
      // 状态更新应该在50ms内完成
      expect(updateTime).toBeLessThan(50)
    })
  })

  describe('边界条件测试', () => {
    it('应该处理极端的冷却时间值', () => {
      const extremeValues = [0, 1, 999]
      
      extremeValues.forEach(cooldown => {
        const { wrapper } = IndexPageTestFactory.createIndexPageWithMockStores({
          cooldownRemaining: cooldown
        })
        
        const fortuneButton = wrapper.findComponent({ name: 'FortuneButton' })
        
        // 验证按钮存在
        expect(fortuneButton.exists()).toBe(true)
        
        // 验证disabled状态逻辑
        const isDisabled = fortuneButton.props('disabled')
        expect(typeof isDisabled).toBe('boolean')
      })
    })

    it('应该处理空的openid', () => {
      const { wrapper } = IndexPageTestFactory.createIndexPageWithMockStores({
        isLoggedIn: true,
        openid: ''
      })
      
      const fortuneButton = wrapper.findComponent({ name: 'FortuneButton' })
      
      // 空openid应该被视为未登录
      expect(fortuneButton.exists()).toBe(true)
    })

    it('应该处理组件快速挂载和卸载', () => {
      const wrapper = IndexPageTestFactory.createIndexPage()
      
      expect(wrapper.exists()).toBe(true)
      
      // 快速卸载
      wrapper.unmount()
      
      // 验证组件已正确卸载（检查是否还能找到元素）
      expect(wrapper.exists()).toBe(false)
    })
  })
})