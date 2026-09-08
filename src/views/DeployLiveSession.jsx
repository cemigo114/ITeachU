import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { API_ENDPOINTS } from '../config/api';
import tasksData from '../data/tasks.json';
import '../styles/gap-finder.css';

const KICKER = { fontSize: 13, fontWeight: 600, color: 'var(--primary)', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 10 };
const H1 = { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 34, lineHeight: 1.08, margin: '0 0 8px' };
const LEAD = { fontSize: 16, color: '#5b6b7a', margin: '0 0 28px', maxWidth: 540 };

const TASK_LIST = Object.entries(tasksData.tasks).map(([id, t]) => ({
  id,
  title: t.title,
  grade: t.grade,
  standard: t.standard,
}));

// Teacher-facing. Replaces gap-finder's LLM generate/review steps with a picker
// over ITeachU's pre-authored task bank, then reuses gap-finder's "Session live"
// code screen (SetupWizard step 3) to project the invite code.
export default function DeployLiveSession() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [query, setQuery] = useState('');
  const [taskId, setTaskId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null); // { code, joinUrl }

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? TASK_LIST.filter((t) =>
          `${t.title} ${t.grade} ${t.standard} ${t.id}`.toLowerCase().includes(q))
      : TASK_LIST;
    return list.slice(0, 40);
  }, [query]);

  const selected = taskId ? TASK_LIST.find((t) => t.id === taskId) : null;

  async function deploy() {
    if (!taskId) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(API_ENDPOINTS.liveDeploy, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ taskId, title: selected?.title }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Couldn't deploy — please try again.");
        return;
      }
      setResult(data);
    } catch {
      setError("Couldn't deploy — please try again.");
    } finally {
      setBusy(false);
    }
  }

  const joinHost = typeof window !== 'undefined' ? `${window.location.host}/app/join` : '…/app/join';

  return (
    <div className="gf-scope">
      <main style={{ maxWidth: 720, margin: '0 auto', padding: '44px 24px 80px' }}>
        {!result && (
          <div style={{ animation: 'gf-up .4s ease both' }}>
            <div style={KICKER}>New live session</div>
            <h1 style={H1}>Pick a task to deploy</h1>
            <p style={LEAD}>Choose a diagnostic task. Zippy opens the conversation with it, and students join with the class code you project.</p>

            <div className="card">
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#3a4753', marginBottom: 8 }}>Find a task</label>
              <input className="input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by title, grade, or standard…" style={{ marginBottom: 16 }} />
              <div style={{ maxHeight: 300, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 12 }}>
                {matches.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTaskId(t.id)}
                    style={{
                      display: 'block', width: '100%', textAlign: 'left', padding: '12px 14px', cursor: 'pointer',
                      border: 'none', borderBottom: '1px solid var(--border)',
                      background: taskId === t.id ? '#e4eef7' : 'transparent',
                      color: 'var(--text)', fontSize: 14,
                    }}
                  >
                    <div style={{ fontWeight: 600 }}>{t.title}</div>
                    <div style={{ fontSize: 12, color: '#9aa7b4' }}>{t.grade} · {t.standard}</div>
                  </button>
                ))}
                {matches.length === 0 && <div style={{ padding: 14, fontSize: 13, color: '#9aa7b4' }}>No tasks match.</div>}
              </div>
              <div style={{ marginTop: 22 }}>
                <button className="btn btn-primary" disabled={busy || !taskId} onClick={deploy} style={{ display: 'inline-flex', alignItems: 'center', gap: 9 }}>
                  {busy && <span className="gf-spinner" />}
                  {busy ? 'Deploying…' : 'Deploy to class'}
                </button>
              </div>
              {error && <div style={{ color: '#b3492f', fontSize: 13, marginTop: 12 }}>{error}</div>}
            </div>
          </div>
        )}

        {result && (
          <div style={{ animation: 'gf-up .4s ease both', textAlign: 'center', paddingTop: 12 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: 'var(--teal)', background: '#d8f1ed', padding: '7px 14px', borderRadius: 999, marginBottom: 22 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--teal)' }} />Session live
            </div>
            <h1 style={{ ...H1, fontSize: 32, margin: '0 0 20px' }}>Your class code is ready</h1>
            <p style={{ fontSize: 17, color: '#5b6b7a', margin: '0 0 6px' }}>Project this on screen — students go to:</p>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 30, color: 'var(--text)', margin: '0 0 28px', whiteSpace: 'nowrap', overflowX: 'auto' }}>
              {joinHost}
            </div>

            <div style={{ maxWidth: 460, margin: '0 auto', background: '#fff', border: '1px solid var(--border)', borderRadius: 20, padding: 30, boxShadow: '0 8px 30px rgba(31,41,51,.08)' }}>
              <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: '#9aa7b4', marginBottom: 14 }}>Class code</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 54, letterSpacing: '.06em', color: 'var(--primary)', lineHeight: 1 }}>{result.code}</div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 26, flexWrap: 'wrap' }}>
              <button className="btn" onClick={() => { setResult(null); setTaskId(null); }}>Deploy another</button>
              <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>Back to dashboard</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
