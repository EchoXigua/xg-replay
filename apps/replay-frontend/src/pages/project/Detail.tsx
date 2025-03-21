import { FC } from 'react'
import { useParams, useLocation } from 'react-router-dom'

const Detail: FC = () => {
  const { projectName } = useParams()
  const location = useLocation()
  const queryParams = new URLSearchParams(location.search)
  const name = queryParams.get('name')

  return (
    <div>
      <div>Detail</div>
      <div>{projectName}</div>
      <div>{name}</div>
    </div>
  )
}

export default Detail
