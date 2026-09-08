import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/gap-finder.css';

// Pixel-faithful port of gap-finder/src/components/JoinForm.tsx.
// The student enters a class code + a name; loginGuest mints a guest JWT and we
// route straight into the existing /teach/:taskId conversation.
export default function JoinLiveSession() {
  const navigate = useNavigate();
  const { code: codeParam } = useParams();
  const { loginGuest } = useAuth();
  const [code, setCode] = useState(codeParam || '');
  const [name, setName] = useState('');
  const [error, setError] = useState(null);
  const [pending, setPending] = useState(false);

  const zippySrc = `${import.meta.env.BASE_URL}zippy.png`;

  async function join() {
    if (!name.trim()) {
      setError("Add a name so your teacher knows it's you.");
      return;
    }
    setError(null);
    setPending(true);
    try {
      const { taskId } = await loginGuest({ code, name });
      navigate(`/teach/${taskId}`);
    } catch (e) {
      setError(e.message || 'Could not join.');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="gf-scope">
      <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '40px 20px 80px', background: 'radial-gradient(120% 90% at 50% -10%, #fff3ec 0%, #eef1f4 55%)' }}>
        <div style={{ width: '100%', maxWidth: 440, textAlign: 'center', animation: 'gf-up .4s ease both' }}>
          <div style={{ position: 'relative', width: 184, height: 184, margin: '0 auto 6px' }}>
            <div style={{ position: 'absolute', bottom: 6, left: '50%', width: 104, height: 20, background: 'radial-gradient(ellipse at center, rgba(10,77,140,.3), rgba(10,77,140,0) 70%)', borderRadius: '50%', animation: 'gf-shadow 4s ease-in-out infinite' }} />
            <div style={{ position: 'absolute', inset: 0, animation: 'gf-float 4s ease-in-out infinite' }}>
              <img src={zippySrc} alt="Zippy" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
          </div>
          <h1 style={{ fontSize: 30, margin: '0 0 6px' }}>Hi, I&rsquo;m Zippy 👋</h1>
          <p style={{ fontSize: 16, color: '#5b6b7a', margin: '0 0 26px' }}>Pop in the class code from your teacher and a name to use.</p>

          <div className="card" style={{ borderRadius: 20, padding: 24, boxShadow: '0 8px 30px rgba(31,41,51,.07)', textAlign: 'left' }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#3a4753', marginBottom: 8 }}>Class code</label>
            <input className="input" value={code} onChange={(e) => setCode(e.target.value)} placeholder="K7P-2QM"
              style={{ marginBottom: 16, fontSize: 18, textTransform: 'uppercase', fontWeight: 600, letterSpacing: '.08em', color: 'var(--primary)' }} />
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#3a4753', marginBottom: 8 }}>Your name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="First name or nickname"
              style={{ marginBottom: 20, fontSize: 16 }} onKeyDown={(e) => { if (e.key === 'Enter') join(); }} />
            <button className="btn btn-coral" onClick={join} disabled={pending} style={{ width: '100%', fontSize: 16, padding: 15, borderRadius: 13 }}>
              {pending ? 'Joining…' : "Let's go →"}
            </button>
            {error && <div style={{ fontSize: 12.5, color: '#b3492f', marginTop: 12, textAlign: 'center' }}>{error}</div>}
          </div>
          <div style={{ fontSize: 12.5, color: '#9aa7b4', marginTop: 16 }}>No account or password needed.</div>
        </div>
      </main>
    </div>
  );
}
