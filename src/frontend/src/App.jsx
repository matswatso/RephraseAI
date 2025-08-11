import { useState, useRef } from 'react'
import './assets/css/style.css'

export default function App() {
  const [text, setText] = useState('')
  const [out, setOut] = useState({ professional:'', casual:'', polite:'', social:'' })
  const [busy, setBusy] = useState(false)
  const abortRef = useRef(null)

  const process = async () => {
    setOut({ professional:'', casual:'', polite:'', social:'' }) // clear the prev outputs
    setBusy(true)
    abortRef.current = new AbortController()
    try {
      const res = await fetch('/api/rewrite', {
        method: 'POST', //posts to the OPENAI api
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
        signal: abortRef.current.signal
      })
      if (!res.ok) throw new Error(`HTTP error - ${res.status}`) //bad status
      const data = await res.json()
      setOut({
        professional: data.professional || '',
        casual: data.casual || '',
        polite: data.polite || '',
        social: data.social || ''
      })
    } catch (e) {
      alert(`Error: ${e.message}`)
    } finally {
      setBusy(false)
      abortRef.current = null
    }
  }
  const cancel = () => abortRef.current?.abort() // aborts the reference if there is  a current reference
  // cancelonly enabled when busy
  return (
    <main>
      <head>
        <title>RephraseAI</title>
      </head>
      <h1>AI Writing Assistant</h1>
      <h3 style={{ fontWeight: 'normal', fontSize: '1.2em',}}>Your Personal AI Writing Assistant</h3>
      <label htmlFor="user-input">Input</label>
      <textarea id="user-input" rows="6"
                placeholder="Type or paste your text…"
                value={text} onChange={e => setText(e.target.value)} />

      <div className="buttons" style={{ display: 'flex', gap: '100px' }}>
        <button className="process" onClick={process} disabled={busy}>Process</button>
        <button className="cancel" onClick={cancel} disabled={!busy}>Cancel</button> 
      </div>

      <div className="outputs">
        <div className="output-block">
          <label>Professional</label>
          <textarea rows="5" readOnly value={out.professional} />
        </div>
        <div className="output-block">
          <label>Casual</label>
          <textarea rows="5" readOnly value={out.casual} />
        </div>
        <div className="output-block">
          <label>Polite</label>
          <textarea rows="5" readOnly value={out.polite} />
        </div>
        <div className="output-block">
          <label>Social-media</label>
          <textarea rows="5" readOnly value={out.social} />
        </div>
      </div>
    </main>
  )
}
