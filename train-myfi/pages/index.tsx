import React, { useEffect, useRef, useState } from 'react';

type Profile = any;
type Session = any;
type SessionListItem = { id: string; persona: string; updated_at: string; turn_count: number; status: string; };

export default function Home() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summary, setSummary] = useState<string>('');
  const [coachNotes, setCoachNotes] = useState<string>('');
  const [firstImpressions, setFirstImpressions] = useState<string>('');
  const [notesSaving, setNotesSaving] = useState(false);
  const [impressionsSaving, setImpressionsSaving] = useState(false);
  const [showBackstory, setShowBackstory] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'assessment'>('overview');
  const chatRef = useRef<HTMLDivElement>(null);

  // Simple markdown-like formatting
  function formatSummary(text: string) {
    return text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')  // **bold**
      .replace(/\*(.+?)\*/g, '<em>$1</em>')              // *italic*
      .replace(/\n/g, '<br />')                           // newlines
      .replace(/^- (.+)$/gm, '<li>$1</li>')              // list items
      .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');        // wrap lists
  }

  // Load sessions list and auto-load most recent session
  useEffect(() => {
    loadSessionsList();
  }, []);

  // Auto-load most recent session after sessions list loads
  useEffect(() => {
    if (sessions.length > 0 && !session) {
      loadExistingSession(sessions[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessions.length]);

  async function loadSessionsList() {
    try {
      const res = await fetch('/api/sessions');
      const data = await res.json();
      // Ensure we always set an array, even if API returns error object
      setSessions(Array.isArray(data) ? data : []);
    } catch {
      setSessions([]);
    }
  }

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [session?.transcript?.length]);

  async function sendMessage() {
    if (!session) return;
    const text = input.trim();
    if (!text) return;
    setLoading(true);

    // Optimistically show coach message
    setSession((prev:any) => prev ? ({
      ...prev,
      transcript: [...(prev.transcript || []), { speaker:'coach', text, ts: Date.now() }]
    }) : prev);

    setInput('');

    try {
      const res = await fetch('/api/chat', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ sessionId: session.session_id, message: text }) });
      const data = await res.json();

      // Append AI reply
      if (data?.reply) {
        setSession((prev:any) => prev ? ({
          ...prev,
          transcript: [...(prev.transcript || []), { speaker:'user', text: data.reply, ts: Date.now() }]
        }) : prev);
      }
      // Optional: background sync without overwriting shorter transcripts
      setTimeout(async () => {
        try {
          const r2 = await fetch(`/api/loadSession?sessionId=${session.session_id}`);
          if (!r2.ok) return;
          const s2 = await r2.json();
          setSession((prev:any) => {
            if (!prev) return s2;
            const prevLen = prev.transcript?.length || 0;
            const newLen = s2.transcript?.length || 0;
            return newLen >= prevLen ? s2 : prev; // prevent clobbering optimistic state
          });
        } catch {}
      }, 400);
    } catch (e) {
      // no-op: optimistic UI remains; could show toast
    } finally {
      setLoading(false);
    }
  }

  async function newProfile() {
    setProfileLoading(true);
    try {
      const res = await fetch('/api/loadSession');
      const s = await res.json();
      setSession(s);
      setProfile(s.profile);
      setCoachNotes('');
      setFirstImpressions('');
      setSummary('');
      setShowBackstory(false);
      loadSessionsList(); // Refresh sessions list
    } catch (e) {
      console.error('Failed to create profile', e);
    } finally {
      setProfileLoading(false);
    }
  }

  async function deleteSession(sessionId: string) {
    if (!confirm('Delete this session? This cannot be undone.')) return;
    try {
      await fetch('/api/deleteSession', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      });
      if (session?.session_id === sessionId) {
        setSession(null);
        setProfile(null);
        setCoachNotes('');
        setFirstImpressions('');
        setSummary('');
        setShowBackstory(false);
      }
      loadSessionsList();
    } catch (e) {
      console.error('Failed to delete session', e);
    }
  }

  async function loadExistingSession(sessionId: string) {
    try {
      const res = await fetch(`/api/loadSession?sessionId=${sessionId}`);
      const s = await res.json();
      setSession(s);
      setProfile(s.profile);
      setCoachNotes(s.coach_notes || '');
      setFirstImpressions(s.first_impressions || '');
      setSummary('');
      setShowBackstory(false);
    } catch (e) {
      console.error('Failed to load session', e);
    }
  }

  async function generateSummary() {
    if (!session) return;
    setSummaryLoading(true);
    try {
      const res = await fetch(`/api/summary?sessionId=${session.session_id}`);
      const data = await res.json();
      setSummary(data.summary || 'No summary generated.');
    } catch (e) {
      setSummary('Failed to generate summary.');
    } finally {
      setSummaryLoading(false);
    }
  }

  async function saveCoachNotes() {
    if (!session) return;
    setNotesSaving(true);
    try {
      await fetch('/api/updateCoachNotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: session.session_id, notes: coachNotes })
      });
    } catch (e) {
      console.error('Failed to save notes', e);
    } finally {
      setNotesSaving(false);
    }
  }

  async function saveFirstImpressions() {
    if (!session) return;
    setImpressionsSaving(true);
    try {
      await fetch('/api/updateCoachNotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: session.session_id, firstImpressions })
      });
    } catch (e) {
      console.error('Failed to save impressions', e);
    } finally {
      setImpressionsSaving(false);
    }
  }

  return (
    <div className="app">
      <div className="top-actions">
        <button className="btn secondary" onClick={newProfile} disabled={profileLoading}>
          {profileLoading ? 'Generating Profile...' : 'New Random Profile / Session'}
        </button>
        <button className="btn secondary" onClick={generateSummary}>Generate AI Summary</button>
      </div>

      <div className="shell">
        {/* Sessions List */}
        <aside className="sessions-sidebar">
          <h3 className="heading">Sessions</h3>
          {sessions.length === 0 && <div style={{color:'var(--muted)', fontSize:13}}>No sessions yet</div>}
          {sessions.map((s) => (
            <div 
              key={s.id} 
              className={`session-item ${session?.session_id === s.id ? 'active' : ''}`}
            >
              <div onClick={() => loadExistingSession(s.id)} style={{flex: 1}}>
                <div className="session-persona">{s.persona}</div>
                <div className="session-time">
                  {new Date(s.updated_at).toLocaleDateString()} • {s.turn_count} turns
                </div>
              </div>
              <button 
                className="delete-btn"
                onClick={(e) => { e.stopPropagation(); deleteSession(s.id); }}
                title="Delete session"
              >
                ×
              </button>
            </div>
          ))}
        </aside>

        {/* Chat + Summary Column */}
        <div className="chat-column">
          {/* Chat */}
          <section className="chat-wrap">
            <div className="chat-header">
              <div className="chat-title">Chat Session</div>
            </div>
            <div className="chat" ref={chatRef}>
              {session?.transcript?.map((t:any, i:number) => (
                <div key={i} className={`row ${t.speaker === 'coach' ? 'user' : 'model'}`}>
                  <div className="bubble">
                    <div className="label">{t.speaker === 'coach' ? 'Coach' : 'User'}</div>
                    <div>{t.text}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="controls">
              <input
                className="input"
                value={input}
                onChange={(e)=>setInput(e.target.value)}
                onKeyDown={(e)=>{ if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder="Ask a question…"
              />
              <button className="btn" onClick={sendMessage} disabled={loading}>{loading ? 'Sending…' : 'Send'}</button>
            </div>
          </section>
        </div>

        {/* AI Summary - separate grid item below chat */}
        <aside className="summary">
          <div className="summary-header">
            <h3 className="heading" style={{margin:0}}>AI Summary</h3>
          </div>
          <div 
            className="summary-body" 
            dangerouslySetInnerHTML={{ 
              __html: summaryLoading 
                ? 'Generating summary...' 
                : summary 
                  ? formatSummary(summary) 
                  : 'Click "Generate AI Summary" to analyze this session.' 
            }}
          />
        </aside>

        {/* Profile Column */}
        <div className="profile-column">
          {/* Profile */}
          <aside className="sidebar">
            <h3 className="heading">Profile</h3>
            
            {/* Tabs */}
            <div className="profile-tabs">
              <button 
                className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                Overview
              </button>
              <button 
                className={`tab-btn ${activeTab === 'assessment' ? 'active' : ''}`}
                onClick={() => setActiveTab('assessment')}
              >
                Assessment Data
              </button>
            </div>

            {profile ? (
              <div className="profile-card">
                <div className="persona">Persona: {profile.persona}</div>
                {profile.name && (
                  <div style={{fontSize: '14px', color: 'rgba(255,255,255,0.8)', marginTop: '4px'}}>
                    Name: {profile.name}{profile.age ? `, Age: ${profile.age}` : ''}
                  </div>
                )}

                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <>
                    <div className="habitude-section" style={{marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '16px'}}>
                      <div className="habitude-name">First Impressions</div>
                      <div style={{fontSize: '11px', color: 'var(--muted)', marginBottom: '8px'}}>
                        What are your initial thoughts when seeing this assessment data?
                      </div>
                      <textarea
                        value={firstImpressions}
                        onChange={(e) => setFirstImpressions(e.target.value)}
                        onBlur={saveFirstImpressions}
                        placeholder="Your first impressions after seeing their Money Habitudes profile..."
                        style={{
                          width: '100%',
                          minHeight: '80px',
                          padding: '8px',
                          backgroundColor: 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '6px',
                          color: 'var(--text)',
                          fontSize: '13px',
                          fontFamily: 'inherit',
                          resize: 'vertical'
                        }}
                      />
                      {impressionsSaving && <div style={{fontSize: '11px', color: 'var(--muted)', marginTop: '4px'}}>Saving...</div>}
                    </div>

                    {profile.persona_backstory && (
                      <div className="habitude-section" style={{marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '16px'}}>
                        <button
                          onClick={() => setShowBackstory(!showBackstory)}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            backgroundColor: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            borderRadius: '6px',
                            color: 'var(--text)',
                            fontSize: '13px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: showBackstory ? '12px' : '0'
                          }}
                        >
                          <span>🔍 Real Financial Backstory (Hidden)</span>
                          <span style={{fontSize: '16px'}}>{showBackstory ? '▼' : '▶'}</span>
                        </button>
                        {showBackstory && (
                          <div style={{
                            fontSize: '12px',
                            lineHeight: '1.5',
                            color: 'rgba(255,255,255,0.7)',
                            whiteSpace: 'pre-wrap',
                            padding: '12px',
                            backgroundColor: 'rgba(255,165,0,0.1)',
                            border: '1px solid rgba(255,165,0,0.3)',
                            borderRadius: '6px'
                          }}>
                            {profile.persona_backstory}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="habitude-section" style={{marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '16px'}}>
                      <div className="habitude-name">Coaching Notes</div>
                      <textarea
                        value={coachNotes}
                        onChange={(e) => setCoachNotes(e.target.value)}
                        onBlur={saveCoachNotes}
                        placeholder="Add your thoughts about this profile..."
                        style={{
                          width: '100%',
                          minHeight: '80px',
                          padding: '8px',
                          backgroundColor: 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '6px',
                          color: 'var(--text)',
                          fontSize: '13px',
                          fontFamily: 'inherit',
                          resize: 'vertical'
                        }}
                      />
                      {notesSaving && <div style={{fontSize: '11px', color: 'var(--muted)', marginTop: '4px'}}>Saving...</div>}
                    </div>
                  </>
                )}

                {/* Assessment Data Tab */}
                {activeTab === 'assessment' && (
                  <>
              <div className="habitude-section">
                <div className="habitude-name">Spontaneous</div>
                <div className="pile-row"><span className="pile-label">That's me:</span><span>{profile.spontaneous_thats_me || 0} cards</span></div>
                <div className="pile-row"><span className="pile-label">Sometimes:</span><span>{profile.spontaneous_sometimes_me || 0} cards</span></div>
                <div className="pile-row"><span className="pile-label">Not me:</span><span>{profile.spontaneous_not_me || 0} cards</span></div>
              </div>
              
              <div className="habitude-section">
                <div className="habitude-name">Status</div>
                <div className="pile-row"><span className="pile-label">That's me:</span><span>{profile.status_thats_me || 0} cards</span></div>
                <div className="pile-row"><span className="pile-label">Sometimes:</span><span>{profile.status_sometimes_me || 0} cards</span></div>
                <div className="pile-row"><span className="pile-label">Not me:</span><span>{profile.status_not_me || 0} cards</span></div>
              </div>
              
              <div className="habitude-section">
                <div className="habitude-name">Carefree</div>
                <div className="pile-row"><span className="pile-label">That's me:</span><span>{profile.carefree_thats_me || 0} cards</span></div>
                <div className="pile-row"><span className="pile-label">Sometimes:</span><span>{profile.carefree_sometimes_me || 0} cards</span></div>
                <div className="pile-row"><span className="pile-label">Not me:</span><span>{profile.carefree_not_me || 0} cards</span></div>
              </div>
              
              <div className="habitude-section">
                <div className="habitude-name">Planning</div>
                <div className="pile-row"><span className="pile-label">That's me:</span><span>{profile.planning_thats_me || 0} cards</span></div>
                <div className="pile-row"><span className="pile-label">Sometimes:</span><span>{profile.planning_sometimes_me || 0} cards</span></div>
                <div className="pile-row"><span className="pile-label">Not me:</span><span>{profile.planning_not_me || 0} cards</span></div>
              </div>
              
              <div className="habitude-section">
                <div className="habitude-name">Giving</div>
                <div className="pile-row"><span className="pile-label">That's me:</span><span>{profile.giving_thats_me || 0} cards</span></div>
                <div className="pile-row"><span className="pile-label">Sometimes:</span><span>{profile.giving_sometimes_me || 0} cards</span></div>
                <div className="pile-row"><span className="pile-label">Not me:</span><span>{profile.giving_not_me || 0} cards</span></div>
              </div>
              
              <div className="habitude-section">
                <div className="habitude-name">Security</div>
                <div className="pile-row"><span className="pile-label">That's me:</span><span>{profile.security_thats_me || 0} cards</span></div>
                <div className="pile-row"><span className="pile-label">Sometimes:</span><span>{profile.security_sometimes_me || 0} cards</span></div>
                <div className="pile-row"><span className="pile-label">Not me:</span><span>{profile.security_not_me || 0} cards</span></div>
              </div>
                </>
              )}
            </div>
          ) : <div>Loading profile…</div>}
          </aside>
        </div>
      </div>
    </div>
  )
}
