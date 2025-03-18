import { css, Global } from '@emotion/react'

const baseStyles = css`
  /* 全局基础样式 */
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  html,
  body {
    font-family: 'Arial', sans-serif;
    color: #333;
    height: 100%;
  }

  a {
    text-decoration: none;
    color: inherit;
  }

  ul {
    list-style: none;
  }

  /* 滚动条优化 */
  ::-webkit-scrollbar {
    width: 8px;
  }

  ::-webkit-scrollbar-thumb {
    background-color: rgba(0, 0, 0, 0.2);
    border-radius: 4px;
  }
`

export const BaseStyles = () => <Global styles={baseStyles} />
