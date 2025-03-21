import { FC, useCallback, useEffect, useRef } from 'react'
import RRWebPlayer from 'rrweb-player'
import styled from '@emotion/styled'

export type RRWebEvents = ConstructorParameters<typeof RRWebPlayer>[0]['props']['events']

interface Props {
  className?: string
  events?: RRWebEvents
}

const BaseRRWebPlayer: FC<Props> = ({ events, className }) => {
  const playerEl = useRef<HTMLDivElement>(null)

  const initPlayer = useCallback(() => {
    if (!events) return

    if (!playerEl.current) return

    new RRWebPlayer({
      target: playerEl.current,
      props: {
        events,
        autoPlay: false
      }
    })
  }, [events])

  // events 变化后，初始化播放器
  useEffect(() => void initPlayer(), [initPlayer])

  return <div ref={playerEl} className={className} />
}

const baseRRWebPlayer = styled(BaseRRWebPlayer)``

export default baseRRWebPlayer
