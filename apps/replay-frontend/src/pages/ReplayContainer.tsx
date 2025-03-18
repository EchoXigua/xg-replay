import { useEffect, useRef, useState } from "react";
import Player from 'rrweb-player';
import 'rrweb-player/dist/style.css';
import { useReplayStore } from "../store";

function ReplayContainer() {
    const playerRef = useRef<HTMLDivElement>(null);
    const recordingData = useReplayStore((state) => state.recordingData);
    const containerRef = useRef(null);


    useEffect(() => {
        if (recordingData.length > 0 && playerRef.current) {
          if (containerRef.current) {
            containerRef.current.replace({
              events: recordingData,
            })
          }else {
            containerRef.current =  new Player({
              target: playerRef.current,
              props: {
                events: recordingData,
                width: 800,
                height: 600,
              },
            });
          }

       
        }
      }, [recordingData]);


    return <>
        <div ref={playerRef}></div>
    </>
}


export default ReplayContainer