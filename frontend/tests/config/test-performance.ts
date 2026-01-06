/**
 * 测试性能优化配置
 */

/**
 * 组件挂载性能优化配置
 */
export const PERFORMANCE_CONFIG = {
  // 测试超时配置
  timeouts: {
    unit: 5000,      // 单元测试超时时间
    integration: 10000, // 集成测试超时时间
    e2e: 30000       // 端到端测试超时时间
  },
  
  // 组件挂载优化
  mounting: {
    // 禁用不必要的Vue开发工具
    devtools: false,
    // 禁用Vue警告
    silent: true,
    // 使用浅渲染优化
    shallow: true
  },
  
  // 测试数据缓存
  cache: {
    enabled: true,
    maxSize: 100
  }
}

/**
 * 测试工具性能监控
 */
export class TestPerformanceMonitor {
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
  
  static getAverageTime(testName: string): number {
    const times = this.measurements.get(testName) || []
    return times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0
  }
  
  static getSlowTests(threshold: number = 100): Array<{ name: string; avgTime: number }> {
    const slowTests: Array<{ name: string; avgTime: number }> = []
    
    this.measurements.forEach((times, name) => {
      const avgTime = this.getAverageTime(name)
      if (avgTime > threshold) {
        slowTests.push({ name, avgTime })
      }
    })
    
    return slowTests.sort((a, b) => b.avgTime - a.avgTime)
  }
  
  static reset(): void {
    this.measurements.clear()
  }
  
  static generateReport(): string {
    const report = ['测试性能报告', '='.repeat(50)]
    
    this.measurements.forEach((times, name) => {
      const avgTime = this.getAverageTime(name)
      const maxTime = Math.max(...times)
      const minTime = Math.min(...times)
      
      report.push(`${name}:`)
      report.push(`  平均时间: ${avgTime.toFixed(2)}ms`)
      report.push(`  最大时间: ${maxTime.toFixed(2)}ms`)
      report.push(`  最小时间: ${minTime.toFixed(2)}ms`)
      report.push(`  执行次数: ${times.length}`)
      report.push('')
    })
    
    const slowTests = this.getSlowTests()
    if (slowTests.length > 0) {
      report.push('慢速测试 (>100ms):')
      slowTests.forEach(({ name, avgTime }) => {
        report.push(`  ${name}: ${avgTime.toFixed(2)}ms`)
      })
    }
    
    return report.join('\n')
  }
}

/**
 * 测试缓存管理器
 */
export class TestCacheManager {
  private static cache: Map<string, any> = new Map()
  private static maxSize = PERFORMANCE_CONFIG.cache.maxSize
  
  static set(key: string, value: any): void {
    if (!PERFORMANCE_CONFIG.cache.enabled) return
    
    if (this.cache.size >= this.maxSize) {
      // 删除最旧的缓存项
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }
    
    this.cache.set(key, value)
  }
  
  static get(key: string): any {
    if (!PERFORMANCE_CONFIG.cache.enabled) return undefined
    return this.cache.get(key)
  }
  
  static has(key: string): boolean {
    if (!PERFORMANCE_CONFIG.cache.enabled) return false
    return this.cache.has(key)
  }
  
  static clear(): void {
    this.cache.clear()
  }
  
  static getStats(): { size: number; maxSize: number; hitRate: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: 0 // 需要实现命中率统计
    }
  }
}