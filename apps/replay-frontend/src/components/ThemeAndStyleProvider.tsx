import { FC, ReactNode } from 'react'
import { CacheProvider, ThemeProvider } from '@emotion/react'

interface Props {
  children: ReactNode
}

// 基于坐标数据生成渐变色系
const themeColors = {
  primary: '#673AB7', // 深紫色
  secondary: '#9C27B0', // 品红色
  accent: '#E91E63', // 玫红色
  background: '#F5F4F9', // 浅灰背景
  surface: '#FFFFFF', // 白色卡片
  textPrimary: '#2D3142', // 深灰文字
  textSecondary: '#666666' // 浅灰文字
}

const ThemeAndStyleProvider: FC<Props> = ({ children }) => {
  return <div>ThemeAndStyleProvider</div>
}

export default ThemeAndStyleProvider
