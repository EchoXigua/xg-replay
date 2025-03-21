import { FC } from 'react'
import { Form, Input, Button, Checkbox, Card } from 'antd'
import styled from '@emotion/styled'

// 登录页背景容器
const LoginContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: linear-gradient(180deg, #1a2a6c, #4f46e5);
`

// 登录卡片
const LoginCard = styled(Card)`
  width: 350px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
`

// 标题
const LoginTitle = styled.h2`
  text-align: center;
  color: #1a2a6c;
  margin-bottom: 24px;
`

const Index: FC = () => {
  // 登录成功回调
  const onFinish = (values) => {
    console.log('登录成功:', values)
    // 这里可以调用登录 API 或跳转到其他页面
  }

  // 登录失败回调
  const onFinishFailed = (errorInfo) => {
    console.log('登录失败:', errorInfo)
  }

  return (
    <LoginContainer>
      <LoginCard>
        <LoginTitle>登录</LoginTitle>
        <Form
          name='loginForm'
          initialValues={{ remember: true }}
          onFinish={onFinish}
          onFinishFailed={onFinishFailed}
          layout='vertical'>
          <Form.Item label='用户名' name='username' rules={[{ required: true, message: '请输入用户名!' }]}>
            <Input placeholder='请输入用户名' />
          </Form.Item>

          <Form.Item label='密码' name='password' rules={[{ required: true, message: '请输入密码!' }]}>
            <Input.Password placeholder='请输入密码' />
          </Form.Item>

          <Form.Item name='remember' valuePropName='checked'>
            <Checkbox>记住我</Checkbox>
          </Form.Item>

          <Form.Item>
            <Button type='primary' htmlType='submit' block>
              登录
            </Button>
          </Form.Item>
        </Form>
      </LoginCard>
    </LoginContainer>
  )
}

export default Index
