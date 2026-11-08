import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import './App.css'

const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
const points: Record<string, [number, number][]> = {
  A: [[50, 88], [110, 18], [170, 88], [80, 58], [140, 58]],
  B: [[65, 92], [65, 15], [125, 15], [160, 35], [125, 52], [65, 52], [130, 52], [165, 72], [130, 92]],
  C: [[160, 28], [130, 15], [85, 18], [55, 48], [55, 72], [85, 92], [130, 92], [160, 78]],
  D: [[65, 92], [65, 15], [120, 15], [160, 40], [160, 68], [120, 92]],
  E: [[155, 15], [65, 15], [65, 52], [140, 52], [65, 52], [65, 92], [155, 92]],
  F: [[65, 92], [65, 15], [155, 15], [65, 52], [135, 52]],
  G: [[160, 28], [130, 15], [85, 18], [55, 48], [55, 72], [85, 92], [145, 90], [160, 65], [120, 65]],
  H: [[65, 15], [65, 92], [65, 52], [155, 52], [155, 15], [155, 92]],
  I: [[75, 15], [145, 15], [110, 15], [110, 92], [75, 92], [145, 92]],
  J: [[65, 15], [155, 15], [155, 70], [130, 92], [85, 92], [60, 75]],
  K: [[65, 15], [65, 92], [65, 55], [155, 15], [95, 48], [155, 92]],
  L: [[65, 15], [65, 92], [155, 92]],
  M: [[50, 92], [50, 15], [110, 62], [170, 15], [170, 92]],
  N: [[55, 92], [55, 15], [160, 92], [160, 15]],
  O: [[110, 15], [150, 28], [165, 52], [150, 80], [110, 92], [70, 80], [55, 52], [70, 28], [110, 15]],
  P: [[65, 92], [65, 15], [125, 15], [160, 35], [125, 55], [65, 55]],
  Q: [[110, 15], [150, 28], [165, 52], [150, 80], [110, 92], [70, 80], [55, 52], [70, 28], [110, 15], [150, 105]],
  R: [[65, 92], [65, 15], [125, 15], [160, 35], [125, 55], [65, 55], [155, 92]],
  S: [[155, 25], [125, 15], [85, 18], [60, 38], [85, 52], [135, 58], [160, 75], [130, 92], [85, 90], [60, 78]],
  T: [[55, 15], [165, 15], [110, 15], [110, 92]],
  U: [[60, 15], [60, 68], [85, 92], [135, 92], [160, 68], [160, 15]],
  V: [[55, 15], [105, 92], [165, 15]],
  W: [[45, 15], [70, 92], [110, 52], [150, 92], [175, 15]],
  X: [[60, 15], [160, 92], [110, 52], [160, 15], [60, 92]],
  Y: [[55, 15], [110, 52], [165, 15], [110, 52], [110, 92]],
  Z: [[60, 15], [160, 15], [60, 92], [160, 92]],
}

function playTune(win = false) {
  try {
    const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioContextClass) return
    const ctx = new AudioContextClass()
    const notes = win ? [523, 659, 784, 1047] : [392, 494, 587]
    notes.forEach((frequency, index) => {
      const oscillator = ctx.createOscillator()
      const gain = ctx.createGain()
      oscillator.type = 'sine'
      oscillator.frequency.value = frequency
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + index * 0.16)
      gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + index * 0.16 + 0.025)
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + index * 0.16 + 0.24)
      oscillator.connect(gain)
      gain.connect(ctx.destination)
      oscillator.start(ctx.currentTime + index * 0.16)
      oscillator.stop(ctx.currentTime + index * 0.16 + 0.26)
    })
    window.setTimeout(() => void ctx.close(), 1200)
  } catch { /* audio may be unavailable */ }
}

function App() {
  const [level, setLevel] = useState(0)
  const [joined, setJoined] = useState<number[]>([])
  const [completed, setCompleted] = useState<number[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('alphabet-adventure-progress') || '[]')
      return Array.isArray(saved) ? saved.filter((n) => Number.isInteger(n) && n >= 0 && n < 26) : []
    } catch {
      return []
    }
  })
  const [showWin, setShowWin] = useState(false)
  const [soundOn, setSoundOn] = useState(true)
  const [hint, setHint] = useState(false)
  const tracing = useRef(false)

  useEffect(() => {
    try { localStorage.setItem('alphabet-adventure-progress', JSON.stringify(completed)) } catch { /* storage optional */ }
  }, [completed])

  const letter = letters[level]
  const dots = points[letter]
  const unlockedThrough = Math.min(25, completed.length)
  const done = completed.includes(level)
  const path = useMemo(() => joined.map((index) => dots[index]).filter(Boolean).map(([x, y]) => `${x},${y}`).join(' '), [joined, dots])

  function chooseDot(index: number) {
    if (showWin || joined.includes(index)) return
    const expected = joined.length
    if (index !== expected) {
      if (soundOn) playTune(false)
      setHint(true)
      return
    }
    const next = [...joined, index]
    setJoined(next)
    setHint(false)
    if (next.length === dots.length) {
      setShowWin(true)
      setCompleted((old) => old.includes(level) ? old : [...old, level].sort((a, b) => a - b))
      if (soundOn) playTune(true)
      if ('speechSynthesis' in window) {
        const speech = new SpeechSynthesisUtterance(`Wonderful! You made the letter ${letter}!`)
        speech.rate = 0.9
        window.speechSynthesis.cancel()
        window.speechSynthesis.speak(speech)
      }
    }
  }

  function visitDotAtPointer(event: ReactPointerEvent<SVGSVGElement>) {
    const svg = event.currentTarget
    const matrix = svg.getScreenCTM()
    if (!matrix) return
    const point = svg.createSVGPoint()
    point.x = event.clientX
    point.y = event.clientY
    const position = point.matrixTransform(matrix.inverse())
    let nearest = -1
    let nearestDistance = 16
    dots.forEach(([x, y], index) => {
      const distance = Math.hypot(position.x - x, position.y - y)
      if (distance < nearestDistance) { nearest = index; nearestDistance = distance }
    })
    if (nearest >= 0) chooseDot(nearest)
  }

  function startTracing(event: ReactPointerEvent<SVGSVGElement>) {
    if (showWin) return
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    tracing.current = true
    visitDotAtPointer(event)
  }

  function moveTracing(event: ReactPointerEvent<SVGSVGElement>) {
    if (!tracing.current) return
    event.preventDefault()
    visitDotAtPointer(event)
  }

  function stopTracing() { tracing.current = false }
  function nextLevel() {
    const next = Math.min(25, level + 1)
    setLevel(next)
    setJoined([])
    setShowWin(false)
    setHint(false)
  }

  function restart() {
    setJoined([])
    setShowWin(false)
    setHint(false)
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-mark">🔤</div>
        <div><p className="eyebrow">A LITTLE LEARNING, A LOT OF FUN</p><h1>Alphabet Adventure</h1></div>
        <button className="sound-button" onClick={() => setSoundOn(!soundOn)} aria-label="Toggle sound">{soundOn ? '🔊' : '🔇'}</button>
      </header>

      <section className="welcome-card">
        <div><span className="sun">☀️</span><h2>Let's learn our ABCs!</h2><p>Join the numbered dots in order to make each letter.</p></div>
        <div className="progress-wrap"><strong>{completed.length} / 26</strong><span>letters mastered</span><div className="progress"><i style={{ width: `${completed.length / 26 * 100}%` }} /></div></div>
      </section>

      <section className="game-layout">
        <div className="play-card">
          <div className="level-row"><span className="level-pill">LEVEL {level + 1}</span><span className="letter-name">Letter {letter}</span><span className="stars">{done ? '⭐' : '☆'} {done ? 'Completed' : 'Keep going!'}</span></div>
          <div className={`drawing-area ${showWin ? "letter-shattered" : ""}`}>
            <div className="big-letter">{letter}</div>
            <svg viewBox="0 0 220 120" role="img" aria-label={`Join the dots to draw letter ${letter}`} className="dot-board" onPointerDown={startTracing} onPointerMove={moveTracing} onPointerUp={stopTracing} onPointerCancel={stopTracing}>
              {joined.length > 1 && <polyline points={path} fill="none" stroke="#5b70e8" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />}
              {dots.map(([x, y], index) => <g key={index} className={`dot ${joined.includes(index) ? 'joined' : ''} ${index === joined.length ? 'next-dot' : ''}`}>
                <circle cx={x} cy={y} r="10" /><text x={x} y={y + 3.5}>{index + 1}</text>
              </g>)}
            </svg>
            {showWin && <div className="celebration" aria-live="polite"><div className="glass-shatter" aria-hidden="true">{Array.from({ length: 12 }, (_, index) => <i key={index} className={`glass-piece piece-${index + 1}`} />)}</div><span className="celebrate-content">🎉</span><strong className="celebrate-content">SUPER JOB!</strong><span className="celebrate-content">🫧 🌈 🫧</span><small className="celebrate-content">You made {letter}!</small></div>}
          </div>
          <p className="instruction">{showWin ? 'You are an alphabet superstar!' : hint ? 'Oops! Find dot number ' + (joined.length + 1) + ' next. You can do it!' : `Put your finger on dot 1 and drag through the dots in order.`}</p>
          <div className="action-row">
            <button className="secondary-button" onClick={restart}>↻ Try again</button>
            <button className="hint-button" onClick={() => setHint(true)}>💡 Hint</button>
            {showWin && <button className="primary-button" onClick={nextLevel}>{level === 25 ? 'Play again ↻' : 'Next letter →'}</button>}
          </div>
          {showWin && level === 25 && <button className="primary-button final-button" onClick={() => { setLevel(0); restart() }}>Start the adventure again</button>}
        </div>

        <aside className="levels-card">
          <h3>🌟 Letter levels</h3><p className="levels-subtitle">Unlock each new letter as you learn.</p>
          <div className="letter-grid">{letters.map((item, index) => {
            const unlocked = index <= unlockedThrough || completed.includes(index)
            return <button key={item} disabled={!unlocked} onClick={() => { setLevel(index); restart() }} className={`letter-tile ${level === index ? 'selected' : ''} ${completed.includes(index) ? 'finished' : ''}`}>{item}{completed.includes(index) && <small>✓</small>}</button>
          })}</div>
          <div className="legend"><span>🟣 Current</span><span>⭐ Completed</span><span>🔒 Locked</span></div>
        </aside>
      </section>
      <footer>Made for curious little learners 💛 <span>Learn • Play • Celebrate</span></footer>
    </main>
  )
}

export default App
