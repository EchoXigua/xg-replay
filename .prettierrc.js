module.exports = {
  $schema: 'https://json.schemastore.org/prettierrc',
  semi: false, //末尾分号
  tabWidth: 2, //tab缩进4个空格
  singleQuote: true, //单引号
  printWidth: 120, // 代码宽度建议不超过120字符
  trailingComma: 'none',
  jsxSingleQuote: true, //jsx中使用单引号
  jsxBracketSameLine: true,
  arrowParens: 'always', //箭头函数仅在必要时使用()
  htmlWhitespaceSensitivity: 'css', //html空格敏感度
  overrides: [
    {
      files: '*.json',
      options: {
        printWidth: 120
      }
    }
  ]
}
