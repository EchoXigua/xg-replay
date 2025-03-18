import { useRoutes, BrowserRouter } from 'react-router-dom'
import routes from './routes'
import { Suspense } from 'react'

const Router = () => {
  const element = useRoutes(routes)
  return <Suspense fallback={<div>Loading...</div>}>{element}</Suspense>
}

const AppRouter = () => {
  return (
    <BrowserRouter>
      <Router />
    </BrowserRouter>
  )
}

export default AppRouter
