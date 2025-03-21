import { css, Global } from '@emotion/react'

export const commonStyles = css`
  .page-container {
    .page-search {
    }

    .page-action {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .page-content {
    }
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
