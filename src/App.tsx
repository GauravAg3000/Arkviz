import { PipelineLayout } from './pipeline/Layout'
import { ControlPanel } from './ui/components/ControlPanel'

export default function App() {
  return (
    <div className="h-screen overflow-hidden flex flex-col" style={{ background: '#0B0E14' }}>
      <ControlPanel />
      <div className="flex-1 overflow-hidden">
        <PipelineLayout />
      </div>
    </div>
  )
}
