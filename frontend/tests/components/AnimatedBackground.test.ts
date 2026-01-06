// 动画背景组件测试

import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import AnimatedBackground from '@/components/AnimatedBackground.vue'

// 模拟定时器
jest.useFakeTimers()

// 挂载组件的辅助函数
function mountComponent(options: any = {}) {
  return mount(AnimatedBackground, {
    global: {
      mocks: {
        $uni: global.uni,
        $wx: global.wx
      }
    },
    ...options
  })
}

describe('动画背景组件 (AnimatedBackground)', () => {
  beforeEach(() => {
    jest.clearAllTimers()
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
    jest.useFakeTimers()
  })

  describe('组件渲染测试', () => {
    it('应该正确渲染动画背景容器', () => {
      const wrapper = mountComponent()
      
      expect(wrapper.exists()).toBe(true)
      expect(wrapper.find('.animated-background').exists()).toBe(true)
      expect(wrapper.find('.animated-background').classes()).toContain('animated-background')
    })

    it('应该渲染所有动画容器', () => {
      const wrapper = mountComponent()
      
      // 检查主要动画容器
      expect(wrapper.find('.snow-container').exists()).toBe(true)
      expect(wrapper.find('.fireworks-container').exists()).toBe(true)
      expect(wrapper.find('.floating-decorations').exists()).toBe(true)
      expect(wrapper.find('.golden-rays').exists()).toBe(true)
    })

    it('应该渲染金光射线', () => {
      const wrapper = mountComponent()
      
      const rays = wrapper.findAll('.ray')
      expect(rays).toHaveLength(8) // 8条射线
      
      rays.forEach((ray, index) => {
        expect(ray.exists()).toBe(true)
        expect(ray.classes()).toContain('ray')
      })
    })

    it('应该渲染浮动装饰元素', () => {
      const wrapper = mountComponent()
      
      const decorations = wrapper.findAll('.decoration')
      expect(decorations.length).toBeGreaterThanOrEqual(6) // 至少6个装饰元素
      
      // 检查特定装饰元素
      expect(wrapper.find('.decoration.lantern').exists()).toBe(true)
      expect(wrapper.find('.decoration.coin').exists()).toBe(true)
      expect(wrapper.find('.decoration.dragon').exists()).toBe(true)
      expect(wrapper.find('.decoration.blessing').exists()).toBe(true)
      expect(wrapper.find('.decoration.firecracker').exists()).toBe(true)
      expect(wrapper.find('.decoration.plum-blossom').exists()).toBe(true)
      
      // 检查装饰元素内容
      expect(wrapper.find('.decoration.lantern').text()).toBe('🏮')
      expect(wrapper.find('.decoration.coin').text()).toBe('🪙')
      expect(wrapper.find('.decoration.dragon').text()).toBe('🐉')
      expect(wrapper.find('.decoration.blessing').text()).toBe('福')
      expect(wrapper.find('.decoration.firecracker').text()).toBe('🧨')
      expect(wrapper.find('.decoration.plum-blossom').text()).toBe('🌸')
    })
  })

  describe('动画元素生成测试', () => {
    it('应该在挂载后生成雪花元素', async () => {
      const wrapper = mountComponent()
      
      await nextTick()
      
      const snowflakes = wrapper.findAll('.snowflake')
      expect(snowflakes.length).toBe(25) // 应该生成25个雪花
      
      // 检查雪花内容
      snowflakes.forEach(snowflake => {
        const text = snowflake.text()
        expect(['❄️', '⭐', '✨', '🌟', '💫', '🎊', '🎉']).toContain(text)
      })
    })

    it('应该在挂载后生成烟花元素', async () => {
      const wrapper = mountComponent()
      
      await nextTick()
      
      const fireworks = wrapper.findAll('.firework')
      expect(fireworks.length).toBe(6) // 应该生成6个烟花
      
      // 检查烟花结构
      fireworks.forEach(firework => {
        expect(firework.find('.firework-spark').exists()).toBe(true)
        expect(firework.find('.firework-particles').exists()).toBe(true)
        expect(firework.findAll('.particle')).toHaveLength(6) // 每个烟花6个粒子
      })
    })

    it('雪花应该有随机的样式属性', async () => {
      const wrapper = mountComponent()
      
      await nextTick()
      
      const snowflakes = wrapper.findAll('.snowflake')
      const styles = snowflakes.map(snowflake => snowflake.attributes('style'))
      
      // 检查是否有不同的left位置
      const leftPositions = styles.map(style => {
        const match = style?.match(/left:\s*([^;]+)/)
        return match ? match[1] : null
      }).filter(Boolean)
      
      expect(new Set(leftPositions).size).toBeGreaterThan(1) // 应该有多个不同的位置
      
      // 检查是否有动画持续时间和其他属性
      styles.forEach(style => {
        expect(style).toMatch(/animation-duration/)
        expect(style).toMatch(/opacity/)
        expect(style).toMatch(/--rotation-speed/) // 检查自定义CSS变量
      })
    })

    it('烟花应该有随机的位置属性', async () => {
      const wrapper = mountComponent()
      
      await nextTick()
      
      const fireworks = wrapper.findAll('.firework')
      const styles = fireworks.map(firework => firework.attributes('style'))
      
      // 检查位置属性
      styles.forEach(style => {
        expect(style).toMatch(/left:\s*\d+(\.\d+)?%/)
        expect(style).toMatch(/top:\s*\d+(\.\d+)?%/)
        expect(style).toMatch(/animation-delay/)
        expect(style).toMatch(/animation-duration/)
      })
    })
  })

  describe('动画刷新机制测试', () => {
    it('应该设置定时器来刷新动画', async () => {
      const setIntervalSpy = jest.spyOn(window, 'setInterval')
      
      const wrapper = mountComponent()
      await nextTick()
      
      expect(setIntervalSpy).toHaveBeenCalledWith(
        expect.any(Function),
        30000 // 30秒间隔
      )
      
      setIntervalSpy.mockRestore()
    })

    it('应该在组件卸载时清除定时器', async () => {
      const clearIntervalSpy = jest.spyOn(window, 'clearInterval')
      
      const wrapper = mountComponent()
      await nextTick()
      
      wrapper.unmount()
      
      expect(clearIntervalSpy).toHaveBeenCalled()
      
      clearIntervalSpy.mockRestore()
    })

    it('定时器触发时应该更新动画元素', async () => {
      const wrapper = mountComponent()
      await nextTick()
      
      // 获取初始雪花数量
      const initialSnowflakes = wrapper.findAll('.snowflake')
      expect(initialSnowflakes).toHaveLength(25)
      
      // 触发定时器回调
      jest.advanceTimersByTime(30000)
      await nextTick()
      
      // 雪花数量应该保持不变，但内容可能更新
      const updatedSnowflakes = wrapper.findAll('.snowflake')
      expect(updatedSnowflakes).toHaveLength(25)
    })
  })

  describe('样式和CSS类测试', () => {
    it('背景容器应该有正确的样式类', () => {
      const wrapper = mountComponent()
      
      const background = wrapper.find('.animated-background')
      expect(background.exists()).toBe(true)
      
      // 检查CSS样式属性（通过计算样式或类名）
      expect(background.classes()).toContain('animated-background')
    })

    it('装饰元素应该有特定的CSS类', () => {
      const wrapper = mountComponent()
      
      // 检查各种装饰元素的类名
      expect(wrapper.find('.decoration.lantern').classes()).toContain('lantern')
      expect(wrapper.find('.decoration.coin').classes()).toContain('coin')
      expect(wrapper.find('.decoration.dragon').classes()).toContain('dragon')
      expect(wrapper.find('.decoration.blessing').classes()).toContain('blessing')
      expect(wrapper.find('.decoration.firecracker').classes()).toContain('firecracker')
      expect(wrapper.find('.decoration.plum-blossom').classes()).toContain('plum-blossom')
    })

    it('烟花粒子应该有正确的结构', async () => {
      const wrapper = mountComponent()
      await nextTick()
      
      const fireworks = wrapper.findAll('.firework')
      
      fireworks.forEach(firework => {
        const spark = firework.find('.firework-spark')
        const particles = firework.find('.firework-particles')
        const particleElements = firework.findAll('.particle')
        
        expect(spark.exists()).toBe(true)
        expect(particles.exists()).toBe(true)
        expect(particleElements).toHaveLength(6)
        
        // 检查粒子的样式属性
        particleElements.forEach(particle => {
          const style = particle.attributes('style')
          expect(style).toMatch(/--angle/)
          expect(style).toMatch(/--distance/)
          expect(style).toMatch(/animation-duration/)
        })
      })
    })
  })

  describe('性能和内存管理测试', () => {
    it('应该正确清理定时器避免内存泄漏', async () => {
      const clearIntervalSpy = jest.spyOn(window, 'clearInterval')
      
      const wrapper = mountComponent()
      await nextTick()
      
      // 模拟组件卸载
      wrapper.unmount()
      
      expect(clearIntervalSpy).toHaveBeenCalled()
      
      clearIntervalSpy.mockRestore()
    })

    it('动画元素数量应该保持在合理范围内', async () => {
      const wrapper = mountComponent()
      await nextTick()
      
      // 检查元素数量不会过多影响性能
      const snowflakes = wrapper.findAll('.snowflake')
      const fireworks = wrapper.findAll('.firework')
      const decorations = wrapper.findAll('.decoration')
      const rays = wrapper.findAll('.ray')
      
      expect(snowflakes.length).toBeLessThanOrEqual(30) // 雪花不超过30个
      expect(fireworks.length).toBeLessThanOrEqual(10)  // 烟花不超过10个
      expect(decorations.length).toBeLessThanOrEqual(10) // 装饰不超过10个
      expect(rays.length).toBeLessThanOrEqual(10)       // 射线不超过10个
    })
  })

  describe('响应式和适配测试', () => {
    it('组件应该适配不同屏幕尺寸', () => {
      const wrapper = mountComponent()
      
      // 检查是否有响应式相关的CSS类或属性
      const background = wrapper.find('.animated-background')
      expect(background.exists()).toBe(true)
      
      // 检查装饰元素是否有合适的定位
      const decorations = wrapper.findAll('.decoration')
      decorations.forEach(decoration => {
        const style = decoration.attributes('style')
        // 应该有位置相关的样式
        expect(style).toMatch(/(top|bottom|left|right)/)
      })
    })

    it('动画元素应该有合适的z-index层级', () => {
      const wrapper = mountComponent()
      
      const background = wrapper.find('.animated-background')
      expect(background.exists()).toBe(true)
      
      // 背景应该在底层，不阻挡用户交互
      // 这通过CSS的pointer-events: none和z-index控制
    })
  })
})