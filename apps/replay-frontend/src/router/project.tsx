import { lazy } from 'react'
import { RouteObject } from 'react-router-dom'

const Projects = lazy(() => import('@/pages/project/Index'))
const Detail = lazy(() => import('@/pages/project/Detail'))

const project: RouteObject[] = [
  {
    path: 'project',
    element: <Projects />
  },
  { path: 'project/:projectName', element: <Detail /> }
]
export default project
