import { FC } from 'react'
import { useLocation, useParams } from 'react-router-dom'

const Detail: FC = () => {
  const { id } = useParams()
  const location = useLocation()
  const queryParams = new URLSearchParams(location.search)
  const name = queryParams.get('project')

  return (
    <div>
      {id}--{name}
    </div>
  )
}

export default Detail
