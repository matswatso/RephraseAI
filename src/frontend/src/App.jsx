import { useState, useRef } from "react";
import "./assets/css/style.css";

export default function App() {
  const [text, setText] = useState("");
  const [out, setOut] = useState({ professional: "", casual: "", polite: "", social: "" });
  const [busy, setBusy] = useState(false);
  const controllerRef = useRef(null);
  //for possible new input
  const resetOutputs = () => setOut({ professional: "", casual: "", polite: "", social: "" });

  async function process() {
    const input = (text || "").trim();
    if (!input || busy) return;

    resetOutputs();
    setBusy(true);
    const controller = new AbortController();
    controllerRef.current = controller;

    try { //uses server api/rewrite_stream to get the rephrased text
      const res = await fetch("/api/rewrite_stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: input }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) throw new Error("Stream failed");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      const markers = ["::professional", "::casual", "::polite", "::social"];
      let buffer = "";
      let section = null;

      const push = (sec, chunk) =>
        setOut(prev => ({ ...prev, [sec]: prev[sec] + chunk }));

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // switch sections when markers appear
        while (true) {
          let nextIdx = -1, which = null;
          for (const m of markers) {
            const i = buffer.indexOf(m);
            if (i !== -1 && (nextIdx === -1 || i < nextIdx)) { nextIdx = i; which = m; }
          }
          if (nextIdx === -1) break;

          if (section && nextIdx > 0) push(section, buffer.slice(0, nextIdx));

          buffer = buffer.slice(nextIdx + which.length);
          if (buffer.startsWith("\n")) buffer = buffer.slice(1);

          section = which.slice(2); // "professional" | "casual" | "polite" | "social"
        }

        // keep a small tail in case a marker is split across chunks
        if (section && buffer) {
          const tail = Math.max(0, buffer.length - 32);
          if (tail > 0) { push(section, buffer.slice(0, tail)); buffer = buffer.slice(tail); }
        }
      }

      if (section && buffer) push(section, buffer);
    } catch (e) {
      if (e.name !== "AbortError") { // error that wasnt the user just hitting end
        console.error(e);
        alert("Request failed. Check backend.");
      }
      else{ //the user cancelled on purpose
        alert("Cancel Request Succesful")
      }
    } finally {
      setBusy(false);
      controllerRef.current = null;
    }
  }

  function cancel() {
    controllerRef.current?.abort();
    setBusy(false);
  }

  return (
    <>
      <div className="titleref" style={{ textAlign: 'center', }}>
        <h1>RephraseAI</h1>
        <h3 style={{ fontWeight: 'normal', fontSize: '1.2em' }}>
          Your Personal AI Writing Assistant
        </h3>
      </div>
      <main>
        <div className="input-block">
          <label htmlFor="user-input">Input your text here to be Rephrased</label>
          <textarea
            id="user-input" rows="6" placeholder="Type or paste your text…"
            value={text} onChange={e => setText(e.target.value)}
          />
        </div>
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
      <div className="credits" style={{ textAlign: 'center', }}>
        <p><i>Made by Matthew Watson</i></p>
        <a href="https://www.linkedin.com/in/matthew-wwatson/" target="_blank" rel="noopener noreferrer">My LinkedIn</a>
        <a href="/MattRes.pdf" target="_blank" rel="noopener noreferrer"> View My Resume </a>
      </div>
    </>
  );
}
