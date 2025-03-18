import { css, Global } from '@emotion/react'

export const resetStyles = css`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
`

export const ResetStyles = () => <Global styles={resetStyles} />
