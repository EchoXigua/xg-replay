import { FC, useEffect, useState } from 'react'
import BaseRRWebPlayer, { type RRWebEvents } from './baseRRWebPlayer'

interface Props {
  urls: string[]
  className?: string
}

const RRWebPlayer: FC<Props> = ({ urls }) => {
  const [events, setEvents] = useState<RRWebEvents>([])

  const loadEvents = () => {
    setEvents([])
  }

  useEffect(() => void loadEvents(), [urls])
  return <BaseRRWebPlayer events={events} />
}

export default RRWebPlayer
