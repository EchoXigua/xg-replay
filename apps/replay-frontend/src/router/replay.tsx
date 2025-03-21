import { lazy } from 'react'
import { RouteObject } from 'react-router-dom'

const Replay = lazy(() => import('@/pages/replay/Index'))
const Detail = lazy(() => import('@/pages/replay/Detail'))

const replay: RouteObject[] = [
  {
    path: 'replay',
    element: <Replay />
  },
  {
    path: 'replay/:id',
    element: <Detail />
  }
]
export default replay
