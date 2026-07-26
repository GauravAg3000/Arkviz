import { PipelineLayout } from './pipeline/Layout'
import { ControlPanel } from './ui/components/ControlPanel'
import { StatsPanel } from './ui/components/StatsPanel'
import { EventLog } from './ui/components/EventLog'

export default function App() {
  return (
    <div className="h-screen overflow-hidden flex flex-col" style={{ background: '#0B0E14' }}>
      <ControlPanel />
      <StatsPanel />
      <div className="flex-1 overflow-hidden relative">
        <EventLog />
        <PipelineLayout />
      </div>
    </div>
  )
}
