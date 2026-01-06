/**
 * FortuneButton页面对象 - 封装组件交互逻辑
 */
import type { VueWrapper } from '@vue/test-utils'
import type { ComponentPublicInstance } from 'vue'

export class FortuneButtonPage {
  constructor(private wrapper: VueWrapper<ComponentPublicInstance>) {}

  // 元素获取器
  get button() {
    return this.wrapper.find('.fortune-button')
  }

  get normalContent() {
    return this.wrapper.find('.normal-content')
  }

  get cooldownContent() {
    return this.wrapper.find('.cooldown-content')
  }

  get drawingContent() {
    return this.wrapper.find('.drawing-content')
  }

  get countdownTimer() {
    return this.wrapper.findComponent({ name: 'CountdownTimer' })
  }

  get decorationElements() {
    return {
      outerRing: this.wrapper.find('.outer-ring'),
      innerRing: this.wrapper.find('.inner-ring'),
      goldenRays: this.wrapper.find('.golden-rays'),
      sparkles: this.wrapper.findAll('.sparkle')
    }
  }

  get loadingDots() {
    return this.wrapper.findAll('.dot')
  }

  // 状态检查方法
  isNormalState(): boolean {
    return this.normalContent.exists() && 
           !this.cooldownContent.exists() && 
           !this.drawingContent.exists()
  }

  isCooldownState(): boolean {
    return this.cooldownContent.exists() && this.countdownTimer.exists()
  }

  isDrawingState(): boolean {
    return this.drawingContent.exists() && this.loadingDots.length === 3
  }

  isDisabled(): boolean {
    return this.button.classes().includes('disabled') &&
           this.button.attributes('disabled') !== undefined
  }

  // 交互方法
  async click(): Promise<void> {
    await this.button.trigger('click')
  }

  // 断言方法
  shouldHaveText(text: string): void {
    expect(this.wrapper.text()).toContain(text)
  }

  shouldHaveClass(className: string): void {
    expect(this.button.classes()).toContain(className)
  }

  shouldEmitEvent(eventName: string): void {
    expect(this.wrapper.emitted(eventName)).toBeTruthy()
  }

  shouldNotEmitEvent(eventName: string): void {
    expect(this.wrapper.emitted(eventName)).toBeFalsy()
  }

  shouldHaveCountdownSeconds(seconds: number): void {
    expect(this.countdownTimer.props('seconds')).toBe(seconds)
  }

  shouldHaveCorrectDecorations(): void {
    const { outerRing, innerRing, goldenRays, sparkles } = this.decorationElements
    
    expect(outerRing.exists()).toBe(true)
    expect(innerRing.exists()).toBe(true)
    expect(goldenRays.exists()).toBe(true)
    expect(sparkles).toHaveLength(6)
  }
}

export class CountdownTimerPage {
  constructor(private wrapper: VueWrapper<ComponentPublicInstance>) {}

  // 元素获取器
  get container() {
    return this.wrapper.find('.countdown-timer')
  }

  get display() {
    return this.wrapper.find('.countdown-display')
  }

  get numberElement() {
    return this.wrapper.find('.countdown-number')
  }

  get textElement() {
    return this.wrapper.find('.countdown-text')
  }

  get progressRing() {
    return this.wrapper.find('.progress-ring')
  }

  get decorationIcon() {
    return this.wrapper.find('.decoration-icon')
  }

  // 状态检查方法
  getCurrentSeconds(): string {
    return this.numberElement.text()
  }

  getText(): string {
    return this.textElement.text()
  }

  // 断言方法
  shouldShowSeconds(seconds: number): void {
    expect(this.getCurrentSeconds()).toBe(seconds.toString())
  }

  shouldShowText(text: string): void {
    expect(this.getText()).toBe(text)
  }

  shouldHaveProgressRing(): void {
    expect(this.progressRing.exists()).toBe(true)
    expect(this.wrapper.find('.progress-svg').exists()).toBe(true)
    expect(this.wrapper.find('.progress-bg').exists()).toBe(true)
    expect(this.wrapper.find('.progress-bar').exists()).toBe(true)
  }

  shouldHaveDecoration(): void {
    expect(this.wrapper.find('.timer-decoration').exists()).toBe(true)
    expect(this.decorationIcon.exists()).toBe(true)
    expect(this.decorationIcon.text()).toBe('⏰')
  }

  shouldEmitFinished(): void {
    expect(this.wrapper.emitted('finished')).toBeTruthy()
  }
}