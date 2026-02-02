import { useEffect, useMemo, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { open } from '@tauri-apps/plugin-dialog'
import './App.css'

const statusLabels = {
  booting: 'Preparing engine',
  ready: 'Ready',
  transcribing: 'Transcribing',
  error: 'Needs attention',
}

const formatBytes = (value) => {
  if (!value && value !== 0) return 'Unknown size'
  const units = ['B', 'KB', 'MB', 'GB']
  let size = value
  let index = 0
  while (size >= 1024 && index < units.length - 1) {
    size /= 1024
    index += 1
  }
  return `${size.toFixed(size >= 10 || index === 0 ? 0 : 1)} ${units[index]}`
}

const formatTimestamp = (seconds) => {
  const total = Math.round(seconds)
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const secs = total % 60
  return [hours, minutes, secs].map((part) => String(part).padStart(2, '0')).join(':')
}

function App() {
  const [selectedFile, setSelectedFile] = useState(null)
  const [engineStatus, setEngineStatus] = useState('booting')
  const [logs, setLogs] = useState([])
  const [result, setResult] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    let unlistenPromise
    unlistenPromise = listen('transcription:log', (event) => {
      setLogs((prev) => [
        ...prev,
        {
          message: event.payload?.message ?? String(event.payload ?? ''),
          timestamp: new Date(),
        },
      ])
    })

    invoke('ensure_dependencies')
      .then(() => setEngineStatus('ready'))
      .catch((error) => {
        setEngineStatus('error')
        setErrorMessage(String(error))
      })

    return () => {
      if (unlistenPromise) {
        unlistenPromise.then((unlisten) => unlisten()).catch(() => {})
      }
    }
  }, [])

  const filePath = useMemo(() => {
    if (!selectedFile) return ''
    return selectedFile.path || ''
  }, [selectedFile])

  const handleFile = (file) => {
    if (!file) return
    setSelectedFile(file)
    setResult(null)
    setErrorMessage('')
    setLogs([])
  }

  const handleDialogPick = async () => {
    setErrorMessage('')
    const selected = await open({
      multiple: false,
      filters: [
        {
          name: 'Audio/Video',
          extensions: ['mp3', 'wav', 'm4a', 'aac', 'flac', 'ogg', 'mp4', 'mov', 'mkv'],
        },
      ],
    })
    if (!selected) return
    const path = Array.isArray(selected) ? selected[0] : selected
    const name = path.split(/[/\\]/).pop() || path
    handleFile({ path, name, size: null })
  }

  const handleDrop = (event) => {
    event.preventDefault()
    setIsDragging(false)
    const file = event.dataTransfer.files?.[0]
    if (!file) return
    handleFile({
      path: file.path,
      name: file.name,
      size: file.size,
    })
  }

  const startTranscription = async () => {
    if (!selectedFile) {
      setErrorMessage('Select a file before starting transcription.')
      return
    }
    if (!filePath) {
      setErrorMessage('This selection did not provide a full path. Use the Open button or drag & drop inside the desktop app.')
      return
    }

    setEngineStatus('transcribing')
    setErrorMessage('')
    setResult(null)

    try {
      const response = await invoke('transcribe_file', { inputPath: filePath })
      setResult(response)
      setEngineStatus('ready')
    } catch (error) {
      setEngineStatus('error')
      setErrorMessage(String(error))
    }
  }

  return (
    <div className="app">
      <header className="hero">
        <div>
          <p className="eyebrow">Local Whisper Studio</p>
          <h1>Transcribe audio locally without leaving your desktop.</h1>
          <p className="subtitle">Drop a file, watch the engine warm up, and get a clean transcript in seconds.</p>
        </div>
        <div className="status">
          <span className={`status-dot status-${engineStatus}`} />
          <span>{statusLabels[engineStatus]}</span>
        </div>
      </header>

      <main className="grid">
        <section
          className={`panel dropzone ${isDragging ? 'dragging' : ''}`}
          onDragOver={(event) => {
            event.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <div className="dropzone-inner">
            <div>
              <p className="panel-title">Audio or Video</p>
              <p className="panel-description">Drag a file here or choose one from disk.</p>
            </div>
            <div className="dropzone-actions">
              <button type="button" className="btn btn-outline" onClick={handleDialogPick}>
                Open file
              </button>
            </div>
          </div>

          {selectedFile && (
            <div className="file-card">
              <div>
                <p className="file-name">{selectedFile.name}</p>
                <p className="file-meta">{formatBytes(selectedFile.size)}</p>
              </div>
              <button
                type="button"
                className="btn btn-primary"
                onClick={startTranscription}
                disabled={engineStatus === 'booting' || engineStatus === 'transcribing'}
              >
                {engineStatus === 'transcribing' ? 'Working...' : 'Start transcription'}
              </button>
            </div>
          )}
        </section>

        <section className="panel logs">
          <div className="panel-header">
            <p className="panel-title">Session log</p>
            <p className="panel-description">Download, conversion, and inference steps appear here.</p>
          </div>
          <div className="log-list">
            {logs.length === 0 ? (
              <p className="placeholder">Logs will appear as the engine runs.</p>
            ) : (
              logs.map((log, index) => (
                <div className="log-line" key={`${log.timestamp.toISOString()}-${index}`}>
                  <span>{log.message}</span>
                  <span className="log-time">{log.timestamp.toLocaleTimeString()}</span>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="panel result">
          <div className="panel-header">
            <p className="panel-title">Transcript</p>
            <p className="panel-description">Segmented output with timestamps.</p>
          </div>
          {errorMessage && <p className="error-banner">{errorMessage}</p>}
          {!result && !errorMessage && <p className="placeholder">Your transcript will appear here.</p>}
          {result?.segments && (
            <div className="segment-list">
              {result.segments.map((segment, index) => (
                <div className="segment" key={`${segment.start}-${segment.end}-${index}`}>
                  <span className="segment-time">
                    {formatTimestamp(segment.start)} - {formatTimestamp(segment.end)}
                  </span>
                  <p className="segment-text">{segment.text}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

export default App
