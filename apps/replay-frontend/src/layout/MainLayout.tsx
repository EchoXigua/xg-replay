import { FC } from 'react'
import styled from '@emotion/styled'
import { Layout, Menu } from 'antd'
import { Outlet, Link } from 'react-router-dom'

const { Header, Sider, Content, Footer } = Layout

const LayoutContainer = styled(Layout)`
  height: 100vh;
  color: red;
  .ant-layout-sider {
    background-color: #fff;
  }
`

const StyledHeader = styled(Header)`
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
`

const StyledSider = styled(Sider)`
  background: #f5f5f5;
`

const StyledContent = styled(Content)`
  background: white;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
`

const StyledFooter = styled(Footer)`
  text-align: center;
  color: gray;
  margin-top: 20px;
`

const items = [
  { key: 'home', label: <Link to='/'>首页</Link> },
  { key: 'about', label: <Link to='/about'>关于</Link> }
]

const MainLayout: FC = () => {
  return (
    <LayoutContainer>
      {/* 顶部导航栏 */}
      <StyledHeader>我的应用</StyledHeader>

      <Layout>
        {/* 侧边栏 */}
        <StyledSider width={200}>
          <Menu mode='inline' defaultSelectedKeys={['home']} items={items} />
        </StyledSider>

        {/* 内容区 */}
        <Layout className='p-5'>
          <StyledContent>
            <Outlet />
          </StyledContent>

          {/* 底部 */}
          <StyledFooter>© 2024 我的应用</StyledFooter>
        </Layout>
      </Layout>
    </LayoutContainer>
  )
}

export default MainLayout
