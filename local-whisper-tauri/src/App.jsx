import { useEffect, useMemo, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { getCurrentWebview } from '@tauri-apps/api/webview'
import { open } from '@tauri-apps/plugin-dialog'
import './App.css'

const statusLabels = {
  booting: 'Preparing engine',
  ready: 'Ready',
  transcribing: 'Transcribing',
  diarizing: 'Diarizing',
  error: 'Needs attention',
}

const speakerOptions = [
  { label: 'Auto', value: 'auto' },
  { label: '2 speakers', value: '2' },
  { label: '3 speakers', value: '3' },
]

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

const assignSpeakers = (segments, diarizationSegments) => {
  if (!segments?.length || !diarizationSegments?.length) return segments
  return segments.map((segment) => {
    let bestSpeaker = 'UNKNOWN'
    let bestOverlap = 0
    diarizationSegments.forEach((diarization) => {
      const overlap = Math.max(
        0,
        Math.min(segment.end, diarization.end) - Math.max(segment.start, diarization.start),
      )
      if (overlap > bestOverlap) {
        bestOverlap = overlap
        bestSpeaker = diarization.speaker
      }
    })
    return { ...segment, speaker: bestSpeaker }
  })
}

const buildMarkdown = (segments, fileName) => {
  if (!segments?.length) return ''
  const title = fileName ? `# ${fileName}` : '# Transcript'
  const lines = segments.map((segment) => {
    const speaker = segment.speaker ? `[${segment.speaker}] ` : ''
    const time = `${formatTimestamp(segment.start)} - ${formatTimestamp(segment.end)}`
    return `- ${speaker}${time}\n  ${segment.text}`
  })
  return [title, '', ...lines].join('\n')
}

function App() {
  const [selectedFile, setSelectedFile] = useState(null)
  const [engineStatus, setEngineStatus] = useState('booting')
  const [logs, setLogs] = useState([])
  const [result, setResult] = useState(null)
  const [diarizationResult, setDiarizationResult] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [diarizationEnabled, setDiarizationEnabled] = useState(false)
  const [speakerCount, setSpeakerCount] = useState('auto')

  useEffect(() => {
    let unlistenPromise
    let unlistenDiarizationPromise
    let unlistenFileDrop
    const addLog = (event) => {
      setLogs((prev) => [
        ...prev,
        {
          message: event.payload?.message ?? String(event.payload ?? ''),
          timestamp: new Date(),
        },
      ])
    }

    unlistenPromise = listen('transcription:log', addLog)
    unlistenDiarizationPromise = listen('diarization:log', addLog)

    getCurrentWebview()
      .onDragDropEvent((event) => {
        if (event.payload.type === 'drop') {
          const path = event.payload.paths?.[0]
          if (!path) return
          const name = path.split(/[/\\]/).pop() || path
          handleFile({ path, name, size: null })
          setIsDragging(false)
          return
        }
        if (event.payload.type === 'enter' || event.payload.type === 'over') {
          setIsDragging(true)
          return
        }
        setIsDragging(false)
      })
      .then((unlisten) => {
        unlistenFileDrop = unlisten
      })
      .catch(() => {})

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
      if (unlistenDiarizationPromise) {
        unlistenDiarizationPromise.then((unlisten) => unlisten()).catch(() => {})
      }
      if (unlistenFileDrop) {
        unlistenFileDrop()
      }
    }
  }, [])

  const filePath = useMemo(() => {
    if (!selectedFile) return ''
    return selectedFile.path || ''
  }, [selectedFile])

  const mergedSegments = useMemo(() => {
    if (!result?.segments) return null
    return assignSpeakers(result.segments, diarizationResult?.segments)
  }, [result, diarizationResult])

  const handleFile = (file) => {
    if (!file) return
    setSelectedFile(file)
    setResult(null)
    setDiarizationResult(null)
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

  const startAnalysis = async () => {
    if (!selectedFile) {
      setErrorMessage('Select a file before starting analysis.')
      return
    }
    if (!filePath) {
      setErrorMessage('This selection did not provide a full path. Use the Open button or drag & drop inside the desktop app.')
      return
    }

    setEngineStatus('transcribing')
    setErrorMessage('')
    setResult(null)
    setDiarizationResult(null)

    try {
      const transcription = await invoke('transcribe_file', { inputPath: filePath })
      setResult(transcription)
      if (diarizationEnabled) {
        setEngineStatus('diarizing')
        setLogs((prev) => [
          ...prev,
          {
            message: 'Starting diarization',
            timestamp: new Date(),
          },
        ])
        const numSpeakers = speakerCount === 'auto' ? null : Number(speakerCount)
        const diarization = await invoke('diarize_file', {
          inputPath: filePath,
          numSpeakers,
        })
        setDiarizationResult(diarization)
      }
      setEngineStatus('ready')
    } catch (error) {
      setEngineStatus('error')
      setErrorMessage(String(error))
    }
  }

  const handleDownloadMarkdown = () => {
    if (!mergedSegments?.length) return
    const markdown = buildMarkdown(mergedSegments, selectedFile?.name)
    const blob = new Blob([markdown], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${selectedFile?.name || 'transcript'}.md`
    link.click()
    URL.revokeObjectURL(url)
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
              <div className="file-actions">
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={diarizationEnabled}
                    onChange={(event) => setDiarizationEnabled(event.target.checked)}
                  />
                  <span>Enable diarization</span>
                </label>
                <select
                  className="select"
                  value={speakerCount}
                  onChange={(event) => setSpeakerCount(event.target.value)}
                  disabled={!diarizationEnabled}
                >
                  {speakerOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={startAnalysis}
                  disabled={engineStatus === 'booting' || engineStatus === 'transcribing'}
                >
                  {engineStatus === 'transcribing' ? 'Working...' : 'Start analysis'}
                </button>
              </div>
            </div>
          )}
        </section>

        <section className="panel logs">
          <div className="panel-header">
            <div className="panel-header-text">
              <p className="panel-title">Session log</p>
              <p className="panel-description">Download, conversion, and inference steps appear here.</p>
            </div>
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
            <div className="panel-header-text">
              <p className="panel-title">Transcript</p>
              <p className="panel-description">Segmented output with timestamps.</p>
            </div>
            <button
              type="button"
              className="btn btn-outline"
              onClick={handleDownloadMarkdown}
              disabled={!mergedSegments?.length}
            >
              Download Markdown
            </button>
          </div>
          {errorMessage && <p className="error-banner">{errorMessage}</p>}
          {diarizationEnabled && result?.segments && !diarizationResult && engineStatus === 'diarizing' && (
            <p className="info-banner">Diarization is running. Speaker labels will appear when ready.</p>
          )}
          {!result && !errorMessage && <p className="placeholder">Your transcript will appear here.</p>}
          {mergedSegments && (
            <div className="segment-list">
              {mergedSegments.map((segment, index) => (
                <div className="segment" key={`${segment.start}-${segment.end}-${index}`}>
                  <span className="segment-time">
                    {segment.speaker ? (
                      <span className="speaker-chip">{segment.speaker}</span>
                    ) : null}
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
