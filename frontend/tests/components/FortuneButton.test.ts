// 抽签按钮组件测试

import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import FortuneButton from '@/components/FortuneButton.vue'
import CountdownTimer from '@/components/CountdownTimer.vue'

// 性能监控工具
class TestPerformanceMonitor {
  private static measurements: Map<string, number[]> = new Map()
  
  static startMeasurement(testName: string): () => number {
    const startTime = performance.now()
    
    return () => {
      const duration = performance.now() - startTime
      
      if (!this.measurements.has(testName)) {
        this.measurements.set(testName, [])
      }
      
      this.measurements.get(testName)!.push(duration)
      return duration
    }
  }
  
  static getSlowTests(threshold: number = 50): Array<{ name: string; avgTime: number }> {
    const slowTests: Array<{ name: string; avgTime: number }> = []
    
    this.measurements.forEach((times, name) => {
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length
      if (avgTime > threshold) {
        slowTests.push({ name, avgTime })
      }
    })
    
    return slowTests.sort((a, b) => b.avgTime - a.avgTime)
  }
}

// 测试工厂类 - 使用工厂模式管理组件创建
interface ComponentState {
  cooldown?: number
  isDrawing?: boolean
  disabled?: boolean
}

interface MountOptions {
  props?: ComponentState
  global?: any
  [key: string]: any
}

class ComponentTestFactory {
  private static defaultGlobalConfig = {
    plugins: [createPinia()],
    stubs: ['uni-button'],
    mocks: {
      $uni: global.uni,
      $wx: global.wx
    },
    components: {
      CountdownTimer
    }
  }

  /**
   * 创建FortuneButton组件实例
   * @param props 组件属性
   * @param options 额外的挂载选项
   */
  static createFortuneButton(props: ComponentState = {}, options: Partial<MountOptions> = {}) {
    try {
      return mount(FortuneButton, {
        props,
        global: this.defaultGlobalConfig,
        ...options
      })
    } catch (error) {
      console.error('创建FortuneButton组件失败:', error)
      throw new Error(`组件挂载失败: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * 创建CountdownTimer组件实例
   * @param props 组件属性
   * @param options 额外的挂载选项
   */
  static createCountdownTimer(props: { seconds?: number } = {}, options: Partial<MountOptions> = {}) {
    try {
      return mount(CountdownTimer, {
        props,
        global: this.defaultGlobalConfig,
        ...options
      })
    } catch (error) {
      console.error('创建CountdownTimer组件失败:', error)
      throw new Error(`组件挂载失败: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * 创建带有特定状态的FortuneButton
   * @param state 组件状态配置
   */
  static createFortuneButtonWithState(state: ComponentState) {
    return this.createFortuneButton(state)
  }

  /**
   * 批量创建组件用于性能测试
   * @param count 创建数量
   * @param props 组件属性
   */
  static createMultipleFortuneButtons(count: number, props: ComponentState = {}) {
    const wrappers = []
    for (let i = 0; i < count; i++) {
      wrappers.push(this.createFortuneButton(props))
    }
    return wrappers
  }
}

// 向后兼容的辅助函数
function mountComponent(component: any, options: any = {}) {
  return mount(component, {
    global: ComponentTestFactory['defaultGlobalConfig'],
    ...options
  })
}

describe('抽签按钮组件 (FortuneButton)', () => {
  describe('状态渲染测试 - 数据驱动', () => {
    const stateTestCases = [
      {
        name: '正常状态',
        props: {},
        expectedClasses: [],
        shouldShowNormal: true,
        shouldShowCooldown: false,
        shouldShowDrawing: false
      },
      {
        name: '冷却状态',
        props: { cooldown: 5 },
        expectedClasses: ['cooldown'],
        shouldShowNormal: false,
        shouldShowCooldown: true,
        shouldShowDrawing: false
      },
      {
        name: '抽签中状态',
        props: { isDrawing: true },
        expectedClasses: ['drawing'],
        shouldShowNormal: false,
        shouldShowCooldown: false,
        shouldShowDrawing: true
      },
      {
        name: '禁用状态',
        props: { disabled: true },
        expectedClasses: ['disabled'],
        shouldShowNormal: true,
        shouldShowCooldown: false,
        shouldShowDrawing: false
      }
    ]

    stateTestCases.forEach(({ name, props, expectedClasses, shouldShowNormal, shouldShowCooldown, shouldShowDrawing }) => {
      it(`应该正确渲染${name}`, () => {
        const wrapper = ComponentTestFactory.createFortuneButton(props)
        
        // 验证CSS类
        expectedClasses.forEach(className => {
          expect(wrapper.find('.fortune-button').classes()).toContain(className)
        })
        
        // 验证内容显示
        expect(wrapper.find('.normal-content').exists()).toBe(shouldShowNormal)
        expect(wrapper.find('.cooldown-content').exists()).toBe(shouldShowCooldown)
        expect(wrapper.find('.drawing-content').exists()).toBe(shouldShowDrawing)
        
        // 特殊状态验证
        if (props.disabled) {
          expect(wrapper.find('button').attributes('disabled')).toBeDefined()
        }
        
        if (props.cooldown && props.cooldown > 0) {
          expect(wrapper.findComponent(CountdownTimer).exists()).toBe(true)
          expect(wrapper.findComponent(CountdownTimer).props('seconds')).toBe(props.cooldown)
        }
      })
    })
  })

  describe('装饰元素测试', () => {
    it('应该有正确的装饰元素', () => {
      const wrapper = mountComponent(FortuneButton)
      
      expect(wrapper.find('.button-decoration').exists()).toBe(true)
      expect(wrapper.find('.outer-ring').exists()).toBe(true)
      expect(wrapper.find('.inner-ring').exists()).toBe(true)
      expect(wrapper.find('.golden-rays').exists()).toBe(true)
      expect(wrapper.find('.decoration-sparkles').exists()).toBe(true)
    })

    it('应该有6个闪烁星星', () => {
      const wrapper = mountComponent(FortuneButton)
      
      const sparkles = wrapper.findAll('.sparkle')
      expect(sparkles).toHaveLength(6)
      
      // 检查星星的类名
      expect(wrapper.find('.star-1').exists()).toBe(true)
      expect(wrapper.find('.star-2').exists()).toBe(true)
      expect(wrapper.find('.star-3').exists()).toBe(true)
      expect(wrapper.find('.star-4').exists()).toBe(true)
      expect(wrapper.find('.star-5').exists()).toBe(true)
      expect(wrapper.find('.star-6').exists()).toBe(true)
    })

    it('应该有双层旋转装饰环', () => {
      const wrapper = mountComponent(FortuneButton)
      
      expect(wrapper.find('.outer-ring').exists()).toBe(true)
      expect(wrapper.find('.inner-ring').exists()).toBe(true)
    })
  })

  describe('交互测试 - 参数化', () => {
    const interactionTestCases = [
      {
        name: '正常状态',
        props: {},
        shouldEmitClick: true,
        description: '正常状态下点击应该触发事件'
      },
      {
        name: '禁用状态',
        props: { disabled: true },
        shouldEmitClick: false,
        description: '禁用状态下点击不应该触发事件'
      },
      {
        name: '冷却状态',
        props: { cooldown: 5 },
        shouldEmitClick: false,
        description: '冷却状态下点击不应该触发事件'
      },
      {
        name: '抽签中状态',
        props: { isDrawing: true },
        shouldEmitClick: false,
        description: '抽签中状态下点击不应该触发事件'
      }
    ]

    interactionTestCases.forEach(({ name, props, shouldEmitClick, description }) => {
      it(description, async () => {
        const wrapper = ComponentTestFactory.createFortuneButton(props)
        
        await wrapper.find('.fortune-button').trigger('click')
        
        if (shouldEmitClick) {
          expect(wrapper.emitted('click')).toBeTruthy()
          expect(wrapper.emitted('click')).toHaveLength(1)
        } else {
          expect(wrapper.emitted('click')).toBeFalsy()
        }
      })
    })
  })

  describe('状态样式测试', () => {
    it('冷却状态应该有不同的样式', () => {
      const wrapper = mountComponent(FortuneButton, {
        props: {
          cooldown: 3
        }
      })
      
      const button = wrapper.find('.fortune-button')
      expect(button.classes()).toContain('cooldown')
    })

    it('抽签中状态应该有动画效果', () => {
      const wrapper = mountComponent(FortuneButton, {
        props: {
          isDrawing: true
        }
      })
      
      const button = wrapper.find('.fortune-button')
      expect(button.classes()).toContain('drawing')
      expect(wrapper.findAll('.dot')).toHaveLength(3)
      
      // 检查加载点的类名
      expect(wrapper.find('.dot-1').exists()).toBe(true)
      expect(wrapper.find('.dot-2').exists()).toBe(true)
      expect(wrapper.find('.dot-3').exists()).toBe(true)
    })

    it('禁用状态应该有正确的样式和属性', () => {
      const wrapper = mountComponent(FortuneButton, {
        props: {
          disabled: true
        }
      })
      
      const button = wrapper.find('.fortune-button')
      expect(button.classes()).toContain('disabled')
      expect(button.attributes('disabled')).toBeDefined()
    })
  })

  describe('属性变化测试', () => {
    it('冷却时间变化应该更新显示', async () => {
      const wrapper = mountComponent(FortuneButton, {
        props: {
          cooldown: 5
        }
      })
      
      expect(wrapper.findComponent(CountdownTimer).exists()).toBe(true)
      expect(wrapper.findComponent(CountdownTimer).props('seconds')).toBe(5)
      
      await wrapper.setProps({ cooldown: 3 })
      expect(wrapper.findComponent(CountdownTimer).props('seconds')).toBe(3)
      
      await wrapper.setProps({ cooldown: 0 })
      expect(wrapper.find('.normal-content').exists()).toBe(true)
      expect(wrapper.findComponent(CountdownTimer).exists()).toBe(false)
    })

    it('抽签状态变化应该更新显示', async () => {
      const wrapper = mountComponent(FortuneButton)
      
      expect(wrapper.find('.normal-content').exists()).toBe(true)
      expect(wrapper.find('.drawing-content').exists()).toBe(false)
      
      await wrapper.setProps({ isDrawing: true })
      expect(wrapper.find('.drawing-content').exists()).toBe(true)
      expect(wrapper.find('.normal-content').exists()).toBe(false)
      
      await wrapper.setProps({ isDrawing: false })
      expect(wrapper.find('.normal-content').exists()).toBe(true)
      expect(wrapper.find('.drawing-content').exists()).toBe(false)
    })

    it('禁用状态变化应该更新按钮', async () => {
      const wrapper = mountComponent(FortuneButton)
      
      expect(wrapper.find('.fortune-button').classes()).not.toContain('disabled')
      expect(wrapper.find('button').attributes('disabled')).toBeUndefined()
      
      await wrapper.setProps({ disabled: true })
      expect(wrapper.find('.fortune-button').classes()).toContain('disabled')
      expect(wrapper.find('button').attributes('disabled')).toBeDefined()
    })
  })

  describe('组合状态测试', () => {
    it('同时设置多个状态时应该优先显示冷却状态', () => {
      const wrapper = mountComponent(FortuneButton, {
        props: {
          cooldown: 5,
          isDrawing: true,
          disabled: true
        }
      })
      
      expect(wrapper.find('.cooldown-content').exists()).toBe(true)
      expect(wrapper.find('.drawing-content').exists()).toBe(false)
      expect(wrapper.find('.normal-content').exists()).toBe(false)
    })

    it('冷却结束后应该显示正常状态', async () => {
      const wrapper = mountComponent(FortuneButton, {
        props: {
          cooldown: 1
        }
      })
      
      expect(wrapper.find('.cooldown-content').exists()).toBe(true)
      
      await wrapper.setProps({ cooldown: 0 })
      expect(wrapper.find('.normal-content').exists()).toBe(true)
    })
  })
})

describe('倒计时组件 (CountdownTimer)', () => {
  describe('渲染测试', () => {
    it('应该正确渲染倒计时显示', () => {
      const wrapper = mountComponent(CountdownTimer, {
        props: {
          seconds: 10
        }
      })
      
      expect(wrapper.exists()).toBe(true)
      expect(wrapper.find('.countdown-timer').exists()).toBe(true)
      expect(wrapper.find('.countdown-display').exists()).toBe(true)
      expect(wrapper.find('.countdown-number').exists()).toBe(true)
      expect(wrapper.find('.countdown-text').exists()).toBe(true)
    })

    it('应该显示正确的秒数', () => {
      const wrapper = mountComponent(CountdownTimer, {
        props: {
          seconds: 5
        }
      })
      
      expect(wrapper.find('.countdown-number').text()).toBe('5')
      expect(wrapper.find('.countdown-text').text()).toBe('秒后可再抽')
    })

    it('应该有进度环显示', () => {
      const wrapper = mountComponent(CountdownTimer, {
        props: {
          seconds: 10
        }
      })
      
      expect(wrapper.find('.progress-ring').exists()).toBe(true)
      expect(wrapper.find('.progress-svg').exists()).toBe(true)
      expect(wrapper.find('.progress-bg').exists()).toBe(true)
      expect(wrapper.find('.progress-bar').exists()).toBe(true)
    })

    it('应该有装饰元素', () => {
      const wrapper = mountComponent(CountdownTimer, {
        props: {
          seconds: 5
        }
      })
      
      expect(wrapper.find('.timer-decoration').exists()).toBe(true)
      expect(wrapper.find('.decoration-icon').exists()).toBe(true)
      expect(wrapper.find('.decoration-icon').text()).toBe('⏰')
    })
  })

  describe('倒计时功能测试', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('应该在1秒后减少计数', async () => {
      const wrapper = mountComponent(CountdownTimer, {
        props: {
          seconds: 5
        }
      })
      
      expect(wrapper.find('.countdown-number').text()).toBe('5')
      
      jest.advanceTimersByTime(1000)
      await wrapper.vm.$nextTick()
      
      expect(wrapper.find('.countdown-number').text()).toBe('4')
    })

    it('倒计时结束时应该显示0', async () => {
      const wrapper = mountComponent(CountdownTimer, {
        props: {
          seconds: 1
        }
      })
      
      // 等待组件挂载完成
      await wrapper.vm.$nextTick()
      
      // 推进时间到倒计时结束
      jest.advanceTimersByTime(1000)
      await wrapper.vm.$nextTick()
      
      expect(wrapper.find('.countdown-number').text()).toBe('0')
    })

    it('秒数为0时不应该启动倒计时', () => {
      const wrapper = mountComponent(CountdownTimer, {
        props: {
          seconds: 0
        }
      })
      
      expect(wrapper.find('.countdown-number').text()).toBe('0')
      
      jest.advanceTimersByTime(1000)
      expect(wrapper.emitted('finished')).toBeFalsy()
    })
  })

  describe('属性变化测试', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('秒数变化应该重置倒计时', async () => {
      const wrapper = mountComponent(CountdownTimer, {
        props: {
          seconds: 5
        }
      })
      
      jest.advanceTimersByTime(2000)
      await wrapper.vm.$nextTick()
      expect(wrapper.find('.countdown-number').text()).toBe('3')
      
      await wrapper.setProps({ seconds: 10 })
      expect(wrapper.find('.countdown-number').text()).toBe('10')
    })
  })
})

// 性能测试套件
describe('性能测试', () => {
  it('应该在合理时间内完成组件挂载', () => {
    const endMeasurement = TestPerformanceMonitor.startMeasurement('组件挂载性能')
    
    // 创建多个组件实例
    const wrappers = ComponentTestFactory.createMultipleFortuneButtons(10)
    
    const duration = endMeasurement()
    
    expect(duration).toBeLessThan(100) // 100ms内完成
    expect(wrappers).toHaveLength(10)
    
    // 清理
    wrappers.forEach(wrapper => wrapper.unmount())
  })

  it('应该高效处理状态变化', async () => {
    const wrapper = ComponentTestFactory.createFortuneButton()
    const endMeasurement = TestPerformanceMonitor.startMeasurement('状态变化性能')
    
    // 快速切换多个状态
    for (let i = 0; i < 50; i++) {
      await wrapper.setProps({ 
        cooldown: i % 2 === 0 ? 5 : 0,
        isDrawing: i % 3 === 0,
        disabled: i % 4 === 0
      })
    }
    
    const duration = endMeasurement()
    expect(duration).toBeLessThan(200) // 200ms内完成50次状态变化
  })

  afterAll(() => {
    // 输出性能报告
    const slowTests = TestPerformanceMonitor.getSlowTests(50)
    if (slowTests.length > 0) {
      console.warn('发现慢速测试:', slowTests)
    }
  })
})

// 可访问性测试套件
describe('可访问性测试', () => {
  it('应该有正确的可访问性属性', () => {
    const wrapper = ComponentTestFactory.createFortuneButton()
    const button = wrapper.find('button')
    
    // 验证基本可访问性属性
    expect(button.attributes('type')).toBe('button')
    expect(button.attributes('role')).toBeDefined()
    
    // 验证按钮有可访问的文本内容
    expect(button.text().trim().length).toBeGreaterThan(0)
  })

  it('禁用状态应该有正确的可访问性标记', () => {
    const wrapper = ComponentTestFactory.createFortuneButton({ disabled: true })
    const button = wrapper.find('button')
    
    expect(button.attributes('disabled')).toBeDefined()
    expect(button.attributes('aria-disabled')).toBe('true')
  })

  it('冷却状态应该有适当的可访问性信息', () => {
    const wrapper = ComponentTestFactory.createFortuneButton({ cooldown: 5 })
    const timer = wrapper.findComponent(CountdownTimer)
    
    expect(timer.exists()).toBe(true)
    // 倒计时组件应该有适当的aria标签
    expect(timer.attributes('role')).toBeDefined()
  })

  it('抽签中状态应该有加载指示器', () => {
    const wrapper = ComponentTestFactory.createFortuneButton({ isDrawing: true })
    const loadingDots = wrapper.findAll('.dot')
    
    expect(loadingDots).toHaveLength(3)
    // 加载状态应该有适当的aria标签
    expect(wrapper.find('.drawing-content').attributes('aria-live')).toBe('polite')
  })
})

// 边界条件测试
describe('边界条件测试', () => {
  it('应该处理极端的冷却时间值', () => {
    const extremeValues = [0, 1, 999, -1, 0.5]
    
    extremeValues.forEach(value => {
      const wrapper = ComponentTestFactory.createFortuneButton({ cooldown: value })
      
      if (value > 0) {
        expect(wrapper.find('.cooldown-content').exists()).toBe(true)
      } else {
        expect(wrapper.find('.normal-content').exists()).toBe(true)
      }
    })
  })

  it('应该处理快速的属性变化', async () => {
    const wrapper = ComponentTestFactory.createFortuneButton()
    
    // 快速连续变化属性
    await wrapper.setProps({ cooldown: 5 })
    await wrapper.setProps({ cooldown: 0, isDrawing: true })
    await wrapper.setProps({ isDrawing: false, disabled: true })
    await wrapper.setProps({ disabled: false })
    
    // 最终应该回到正常状态
    expect(wrapper.find('.normal-content').exists()).toBe(true)
  })

  it('应该处理组件销毁时的清理', () => {
    const wrapper = ComponentTestFactory.createFortuneButton({ cooldown: 5 })
    
    // 验证组件正常挂载
    expect(wrapper.exists()).toBe(true)
    
    // 销毁组件
    wrapper.unmount()
    
    // 验证组件已销毁
    expect(() => wrapper.find('.fortune-button')).toThrow()
  })
})