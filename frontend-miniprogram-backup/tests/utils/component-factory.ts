/**
 * 组件测试工厂 - 使用工厂模式统一管理测试组件创建
 */
import { mount, VueWrapper } from '@vue/test-utils'
import { createPinia } from 'pinia'
import type { ComponentPublicInstance } from 'vue'

// 组件状态接口定义
export interface FortuneButtonState {
  cooldown?: number
  isDrawing?: boolean
  disabled?: boolean
}

export interface CountdownTimerState {
  seconds?: number
}

/**
 * 测试组件工厂类
 */
export class ComponentTestFactory {
  private static readonly defaultGlobalConfig = {
    plugins: [createPinia()],
    stubs: ['uni-button'],
    mocks: {
      $uni: global.uni,
      $wx: global.wx
    }
  }

  /**
   * 创建FortuneButton组件实例
   * @param state 组件状态配置
   * @param options 额外的挂载选项
   */
  static createFortuneButton(
    state: FortuneButtonState = {},
    options: any = {}
  ): VueWrapper<ComponentPublicInstance> {
    return mount(require('@/components/FortuneButton.vue').default, {
      props: state,
      global: {
        ...this.defaultGlobalConfig,
        components: {
          CountdownTimer: require('@/components/CountdownTimer.vue').default
        }
      },
      ...options
    })
  }

  /**
   * 创建CountdownTimer组件实例
   * @param state 组件状态配置
   * @param options 额外的挂载选项
   */
  static createCountdownTimer(
    state: CountdownTimerState = {},
    options: any = {}
  ): VueWrapper<ComponentPublicInstance> {
    return mount(require('@/components/CountdownTimer.vue').default, {
      props: state,
      global: this.defaultGlobalConfig,
      ...options
    })
  }

  /**
   * 创建带有预设状态组合的FortuneButton
   */
  static createFortuneButtonPresets() {
    return {
      normal: () => this.createFortuneButton(),
      cooldown: (seconds = 5) => this.createFortuneButton({ cooldown: seconds }),
      drawing: () => this.createFortuneButton({ isDrawing: true }),
      disabled: () => this.createFortuneButton({ disabled: true }),
      cooldownAndDisabled: (seconds = 5) => this.createFortuneButton({ 
        cooldown: seconds, 
        disabled: true 
      })
    }
  }
}

/**
 * 测试断言辅助类
 */
export class TestAssertions {
  /**
   * 验证按钮基本结构
   */
  static verifyButtonStructure(wrapper: VueWrapper<ComponentPublicInstance>) {
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.find('.fortune-button').exists()).toBe(true)
    expect(wrapper.find('.button-decoration').exists()).toBe(true)
  }

  /**
   * 验证装饰元素
   */
  static verifyDecorationElements(wrapper: VueWrapper<ComponentPublicInstance>) {
    expect(wrapper.find('.outer-ring').exists()).toBe(true)
    expect(wrapper.find('.inner-ring').exists()).toBe(true)
    expect(wrapper.find('.golden-rays').exists()).toBe(true)
    expect(wrapper.find('.decoration-sparkles').exists()).toBe(true)
    
    const sparkles = wrapper.findAll('.sparkle')
    expect(sparkles).toHaveLength(6)
  }

  /**
   * 验证按钮状态样式
   */
  static verifyButtonState(
    wrapper: VueWrapper<ComponentPublicInstance>, 
    expectedClasses: string[]
  ) {
    const button = wrapper.find('.fortune-button')
    expectedClasses.forEach(className => {
      expect(button.classes()).toContain(className)
    })
  }

  /**
   * 验证倒计时组件
   */
  static verifyCountdownTimer(
    wrapper: VueWrapper<ComponentPublicInstance>, 
    expectedSeconds: number
  ) {
    const timer = wrapper.findComponent({ name: 'CountdownTimer' })
    expect(timer.exists()).toBe(true)
    expect(timer.props('seconds')).toBe(expectedSeconds)
  }
}

/**
 * 测试数据生成器
 */
export class TestDataGenerator {
  /**
   * 生成测试用的状态组合
   */
  static generateStateVariations(): FortuneButtonState[] {
    return [
      {},
      { cooldown: 5 },
      { isDrawing: true },
      { disabled: true },
      { cooldown: 3, disabled: true },
      { cooldown: 0, isDrawing: false, disabled: false }
    ]
  }

  /**
   * 生成倒计时测试数据
   */
  static generateCountdownData(): CountdownTimerState[] {
    return [
      { seconds: 0 },
      { seconds: 1 },
      { seconds: 5 },
      { seconds: 10 },
      { seconds: 30 }
    ]
  }
}