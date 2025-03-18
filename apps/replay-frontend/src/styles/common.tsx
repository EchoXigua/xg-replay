import { css, Global } from '@emotion/react'

export const commonStyles = css`
  .container {
    max-width: 1200px;
    margin: 0 auto;
  }

  .btn-primary {
    background: #1677ff;
    color: white;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
  }
`

export const CommonStyles = () => <Global styles={commonStyles} />
