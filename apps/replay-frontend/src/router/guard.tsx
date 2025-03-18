import { Navigate } from 'react-router-dom'

// 模拟用户登录状态
const isAuthenticated = () => {
  return !!localStorage.getItem('token') // 这里可以换成真实的鉴权逻辑
}

// 受保护的路由
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  return isAuthenticated() ? children : <Navigate to='/login' replace />
}

export default ProtectedRoute
