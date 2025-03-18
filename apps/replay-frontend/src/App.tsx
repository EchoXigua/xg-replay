import AppRouter from '@/router'
import { BaseStyles } from '@/styles/base'
import { CommonStyles } from '@/styles/common'
import { ResetStyles } from '@/styles/reset'

const App: React.FC = () => {
  return (
    <>
      {/* 应用全局样式 */}
      <BaseStyles />
      <CommonStyles />
      <ResetStyles />

      {/* 主布局组件 */}
      <AppRouter />
    </>
  )
}

export default App
