import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@ant-design/v5-patch-for-react-19'
import App from './App.tsx'

import { Replay } from '@xigua/replay'
import { useReplayStore } from './store'

// new Replay({
//   url: 'http://127.0.0.1:3000',
//   onData(data){
//     console.log('触发了数据录制');
//     useReplayStore.getState().setRecordingData(data);
//   }
// }).init()
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
