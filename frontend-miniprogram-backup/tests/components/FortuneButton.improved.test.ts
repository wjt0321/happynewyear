/**
 * 改进后的FortuneButton组件测试 - 应用最佳实践
 */
import { ComponentTestFactory, TestAssertions, TestDataGenerator } from '../utils/component-factory'
import { FortuneButtonPage, CountdownTimerPage } from '../page-objects/FortuneButtonPage'

describe('抽签按钮组件 (FortuneButton) - 改进版', () => {
  
  describe('基础渲染测试', () => {
    it('应该正确渲染所有基础元素', () => {
      const wrapper = ComponentTestFactory.createFortuneButton()
      const page = new FortuneButtonPage(wrapper)
      
      TestAssertions.verifyButtonStructure(wrapper)
      TestAssertions.verifyDecorationElements(wrapper)
      
      expect(page.isNormalState()).toBe(true)
      page.shouldHaveText('抽 签')
      page.shouldHaveText('点击获取新年运势')
    })
  })

  describe('状态渲染测试 - 数据驱动', () => {
    const stateTestCases = [
      {
        name: '正常状态',
        state: {},
        expectedClasses: [],
        shouldShowNormal: true,
        shouldShowCooldown: false,
        shouldShowDrawing: false
      },
      {
        name: '冷却状态',
        state: { cooldown: 5 },
        expectedClasses: ['cooldown'],
        shouldShowNormal: false,
        shouldShowCooldown: true,
        shouldShowDrawing: false
      },
      {
        name: '抽签中状态',
        state: { isDrawing: true },
        expectedClasses: ['drawing'],
        shouldShowNormal: false,
        shouldShowCooldown: false,
        shouldShowDrawing: true
      },
      {
        name: '禁用状态',
        state: { disabled: true },
        expectedClasses: ['disabled'],
        shouldShowNormal: true,
        shouldShowCooldown: false,
        shouldShowDrawing: false
      }
    ]

    stateTestCases.forEach(({ name, state, expectedClasses, shouldShowNormal, shouldShowCooldown, shouldShowDrawing }) => {
      it(`应该正确渲染${name}`, () => {
        const wrapper = ComponentTestFactory.createFortuneButton(state)
        const page = new FortuneButtonPage(wrapper)
        
        // 验证CSS类
        expectedClasses.forEach(className => {
          page.shouldHaveClass(className)
        })
        
        // 验证内容显示
        expect(page.isNormalState()).toBe(shouldShowNormal)
        expect(page.isCooldownState()).toBe(shouldShowCooldown)
        expect(page.isDrawingState()).toBe(shouldShowDrawing)
        
        // 特殊状态验证
        if (state.disabled) {
          expect(page.isDisabled()).toBe(true)
        }
        
        if (state.cooldown && state.cooldown > 0) {
          page.shouldHaveCountdownSeconds(state.cooldown)
        }
      })
    })
  })

  describe('交互测试 - 参数化', () => {
    const interactionTestCases = [
      {
        name: '正常状态',
        state: {},
        shouldEmitClick: true
      },
      {
        name: '禁用状态',
        state: { disabled: true },
        shouldEmitClick: false
      },
      {
        name: '冷却状态',
        state: { cooldown: 5 },
        shouldEmitClick: false
      },
      {
        name: '抽签中状态',
        state: { isDrawing: true },
        shouldEmitClick: false
      }
    ]

    interactionTestCases.forEach(({ name, state, shouldEmitClick }) => {
      it(`${name}下的点击行为应该正确`, async () => {
        const wrapper = ComponentTestFactory.createFortuneButton(state)
        const page = new FortuneButtonPage(wrapper)
        
        await page.click()
        
        if (shouldEmitClick) {
          page.shouldEmitEvent('click')
        } else {
          page.shouldNotEmitEvent('click')
        }
      })
    })
  })

  describe('属性变化测试 - 状态机测试', () => {
    it('应该正确处理状态转换', async () => {
      const wrapper = ComponentTestFactory.createFortuneButton()
      const page = new FortuneButtonPage(wrapper)
      
      // 初始状态 -> 冷却状态
      expect(page.isNormalState()).toBe(true)
      
      await wrapper.setProps({ cooldown: 5 })
      expect(page.isCooldownState()).toBe(true)
      page.shouldHaveCountdownSeconds(5)
      
      // 冷却状态 -> 抽签中状态
      await wrapper.setProps({ cooldown: 0, isDrawing: true })
      expect(page.isDrawingState()).toBe(true)
      
      // 抽签中状态 -> 正常状态
      await wrapper.setProps({ isDrawing: false })
      expect(page.isNormalState()).toBe(true)
    })
  })

  describe('组合状态优先级测试', () => {
    it('应该按正确优先级显示状态', () => {
      const testCases = [
        {
          props: { cooldown: 5, isDrawing: true, disabled: true },
          expectedState: 'cooldown',
          description: '冷却状态优先级最高'
        },
        {
          props: { isDrawing: true, disabled: true },
          expectedState: 'drawing',
          description: '抽签中状态优先于禁用状态'
        }
      ]

      testCases.forEach(({ props, expectedState, description }) => {
        const wrapper = ComponentTestFactory.createFortuneButton(props)
        const page = new FortuneButtonPage(wrapper)
        
        switch (expectedState) {
          case 'cooldown':
            expect(page.isCooldownState()).toBe(true)
            break
          case 'drawing':
            expect(page.isDrawingState()).toBe(true)
            break
        }
      }, description)
    })
  })
})

describe('倒计时组件 (CountdownTimer) - 改进版', () => {
  
  describe('渲染测试 - 数据驱动', () => {
    const renderTestCases = TestDataGenerator.generateCountdownData()

    renderTestCases.forEach(({ seconds }) => {
      it(`应该正确渲染 ${seconds} 秒倒计时`, () => {
        const wrapper = ComponentTestFactory.createCountdownTimer({ seconds })
        const page = new CountdownTimerPage(wrapper)
        
        page.shouldShowSeconds(seconds || 0)
        page.shouldShowText('秒后可再抽')
        page.shouldHaveProgressRing()
        page.shouldHaveDecoration()
      })
    })
  })

  describe('倒计时功能测试 - 时间控制', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('应该正确执行倒计时逻辑', async () => {
      const wrapper = ComponentTestFactory.createCountdownTimer({ seconds: 3 })
      const page = new CountdownTimerPage(wrapper)
      
      // 验证初始状态
      page.shouldShowSeconds(3)
      
      // 模拟1秒后
      jest.advanceTimersByTime(1000)
      await wrapper.vm.$nextTick()
      page.shouldShowSeconds(2)
      
      // 模拟再过1秒
      jest.advanceTimersByTime(1000)
      await wrapper.vm.$nextTick()
      page.shouldShowSeconds(1)
      
      // 模拟倒计时结束
      jest.advanceTimersByTime(1000)
      await wrapper.vm.$nextTick()
      page.shouldShowSeconds(0)
      page.shouldEmitFinished()
    })

    it('应该处理属性变化重置倒计时', async () => {
      const wrapper = ComponentTestFactory.createCountdownTimer({ seconds: 5 })
      const page = new CountdownTimerPage(wrapper)
      
      // 让倒计时进行2秒
      jest.advanceTimersByTime(2000)
      await wrapper.vm.$nextTick()
      page.shouldShowSeconds(3)
      
      // 重置倒计时
      await wrapper.setProps({ seconds: 10 })
      page.shouldShowSeconds(10)
    })
  })
})

describe('性能测试', () => {
  it('应该在合理时间内完成组件挂载', () => {
    const startTime = performance.now()
    
    // 创建多个组件实例
    const wrappers = Array.from({ length: 10 }, () => 
      ComponentTestFactory.createFortuneButton()
    )
    
    const endTime = performance.now()
    const duration = endTime - startTime
    
    expect(duration).toBeLessThan(100) // 100ms内完成
    expect(wrappers).toHaveLength(10)
    
    // 清理
    wrappers.forEach(wrapper => wrapper.unmount())
  })
})

describe('可访问性测试', () => {
  it('应该有正确的可访问性属性', () => {
    const wrapper = ComponentTestFactory.createFortuneButton()
    const button = wrapper.find('button')
    
    // 验证基本可访问性属性
    expect(button.attributes('type')).toBe('button')
    expect(button.attributes('role')).toBeDefined()
    
    // 验证禁用状态的可访问性
    const disabledWrapper = ComponentTestFactory.createFortuneButton({ disabled: true })
    const disabledButton = disabledWrapper.find('button')
    expect(disabledButton.attributes('disabled')).toBeDefined()
    expect(disabledButton.attributes('aria-disabled')).toBe('true')
  })
})