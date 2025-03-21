import { FC } from 'react'
import styled from '@emotion/styled'
import { Outlet, Link } from 'react-router-dom'
import { css } from '@emotion/react'
import { Layout, Menu } from 'antd'

const { Sider, Content, Footer } = Layout

const items = [
  { key: 'project', label: <Link to='/project'>项目</Link> },
  { key: 'replay', label: <Link to='/replay'>重播</Link> },
  { key: 'home', label: <Link to='/'>首页</Link> },
  { key: 'about', label: <Link to='/about'>关于</Link> }
]

const MainLayout: FC = () => {
  return (
    <Layout
      css={css`
        min-height: 100vh;
      `}>
      {/* 侧边栏 */}
      <Sider>
        <div
          css={css`
            display: flex;
            justify-content: center;
            align-items: center;
            color: #fff;
            height: 48px;
          `}>
          XG-Replay
        </div>
        <Menu mode='inline' defaultSelectedKeys={['home']} theme='dark' items={items} />
      </Sider>

      {/* 内容区 */}
      <Layout>
        <Content
          css={css`
            padding: 16px;
          `}>
          <Outlet />
        </Content>

        {/* 底部 */}
        <Footer>© 2024 我的应用</Footer>
      </Layout>
    </Layout>
  )
}

export default MainLayout
