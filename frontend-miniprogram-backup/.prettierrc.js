module.exports = {
  // 基础格式化选项
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  semi: true,
  singleQuote: true,
  quoteProps: 'as-needed',
  trailingComma: 'es5',
  bracketSpacing: true,
  bracketSameLine: false,
  arrowParens: 'avoid',
  
  // Vue 文件特殊配置
  vueIndentScriptAndStyle: false,
  
  // 行尾符号
  endOfLine: 'lf',
  
  // 文件类型特殊配置
  overrides: [
    {
      files: '*.vue',
      options: {
        parser: 'vue'
      }
    },
    {
      files: ['*.json', '*.jsonc'],
      options: {
        parser: 'json'
      }
    },
    {
      files: '*.scss',
      options: {
        parser: 'scss'
      }
    }
  ]
};