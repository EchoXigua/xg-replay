import { RouteObject } from 'react-router-dom'
import { lazy } from 'react'

const Layout = lazy(() => import('@/layout/MainLayout'))

const Home = lazy(() => import('@/pages/home/Home'))
const About = lazy(() => import('@/pages/home/About'))

const NotFound = lazy(() => import('@/pages/404/NotFound'))
const Login = lazy(() => import('@/pages/auth/Login'))
const Register = lazy(() => import('@/pages/auth/Register'))

const routes: RouteObject[] = [
  {
    path: '/',
    element: <Layout />, // 主布局
    children: [
      { index: true, element: <Home /> }, // `index: true` 表示默认路由
      { path: 'about', element: <About /> },
      { path: '*', element: <NotFound /> } // 404 页面
    ]
  },
  {
    path: '/login',
    element: <Login />
  },
  {
    path: '/register',
    element: <Register />
  }
]

export default routes
