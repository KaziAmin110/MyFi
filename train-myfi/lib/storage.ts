import { supa } from './supa';
import { summarizeConversation } from './genai';

export async function saveSession(session: any) {
  // Upsert session + append new messages to Supabase
  try {
    const p = session.profile || {};
    
    // Calculate dominant habitudes from that's_me counts
    const habitudes = [
      { name: 'spontaneous', count: p.spontaneous_thats_me || 0 },
      { name: 'status', count: p.status_thats_me || 0 },
      { name: 'carefree', count: p.carefree_thats_me || 0 },
      { name: 'planning', count: p.planning_thats_me || 0 },
      { name: 'giving', count: p.giving_thats_me || 0 },
      { name: 'security', count: p.security_thats_me || 0 },
    ];
    habitudes.sort((a, b) => b.count - a.count);
    const dominant = habitudes.slice(0, 3).filter(h => h.count > 0).map(h => h.name);

    const { error: sessionError } = await supa.from('sessions').upsert({
      id: session.session_id,
      updated_at: new Date().toISOString(),
      
      // Store persona and backstory
      persona: p.persona || null,
      persona_backstory: p.persona_backstory || null,
      first_impressions: session.first_impressions || null,
      name: p.name || null,
      age: p.age || null,
      
      // Store counts for each pile
      spontaneous_thats_me: p.spontaneous_thats_me || 0,
      spontaneous_sometimes_me: p.spontaneous_sometimes_me || 0,
      spontaneous_not_me: p.spontaneous_not_me || 0,
      
      status_thats_me: p.status_thats_me || 0,
      status_sometimes_me: p.status_sometimes_me || 0,
      status_not_me: p.status_not_me || 0,
      
      carefree_thats_me: p.carefree_thats_me || 0,
      carefree_sometimes_me: p.carefree_sometimes_me || 0,
      carefree_not_me: p.carefree_not_me || 0,
      
      planning_thats_me: p.planning_thats_me || 0,
      planning_sometimes_me: p.planning_sometimes_me || 0,
      planning_not_me: p.planning_not_me || 0,
      
      giving_thats_me: p.giving_thats_me || 0,
      giving_sometimes_me: p.giving_sometimes_me || 0,
      giving_not_me: p.giving_not_me || 0,
      
      security_thats_me: p.security_thats_me || 0,
      security_sometimes_me: p.security_sometimes_me || 0,
      security_not_me: p.security_not_me || 0,
      
      dominant_habitudes: dominant,
      turn_count: (session.transcript || []).length,
      status: session.status || 'active',
    });

    if (sessionError) {
      console.error('Failed to save session:', sessionError);
      throw new Error(`Failed to save session: ${sessionError.message}`);
    }

    const { count, error: countError } = await supa
      .from('session_messages')
      .select('id', { count: 'exact', head: true })
      .eq('session_id', session.session_id);

    if (countError) {
      console.error('Failed to count messages:', countError);
      throw new Error(`Failed to count messages: ${countError.message}`);
    }

    const existing = count || 0;
    const toInsert = (session.transcript || []).slice(existing).map((m: any, idx: number) => ({
      session_id: session.session_id,
      role: m.speaker,
      content: m.text,
      turn_number: existing + idx,
      created_at: new Date(m.ts || Date.now()).toISOString(),
    }));
    
    if (toInsert.length) {
      const { error: insertError } = await supa.from('session_messages').insert(toInsert);
      if (insertError) {
        console.error('Failed to insert messages:', insertError);
        throw new Error(`Failed to insert messages: ${insertError.message}`);
      }
    }
  } catch (error: any) {
    console.error('Error in saveSession:', error);
    throw error;
  }
}

export async function getSession(sessionId: string) {
  const { data: s } = await supa.from('sessions').select('*').eq('id', sessionId).maybeSingle();
  if (!s) return null;
  const { data: msgs } = await supa
    .from('session_messages')
    .select('role,content,created_at,turn_number')
    .eq('session_id', sessionId)
    .order('turn_number', { ascending: true });
    
    const profile = {
      persona: s.persona || 'person',
      persona_backstory: s.persona_backstory || '',
      name: s.name || 'Client',
      age: s.age || 30,
      
      spontaneous_thats_me: s.spontaneous_thats_me || 0,
      spontaneous_sometimes_me: s.spontaneous_sometimes_me || 0,
      spontaneous_not_me: s.spontaneous_not_me || 0,
      
      status_thats_me: s.status_thats_me || 0,
      status_sometimes_me: s.status_sometimes_me || 0,
      status_not_me: s.status_not_me || 0,
      
      carefree_thats_me: s.carefree_thats_me || 0,
      carefree_sometimes_me: s.carefree_sometimes_me || 0,
      carefree_not_me: s.carefree_not_me || 0,
      
      planning_thats_me: s.planning_thats_me || 0,
      planning_sometimes_me: s.planning_sometimes_me || 0,
      planning_not_me: s.planning_not_me || 0,
      
      giving_thats_me: s.giving_thats_me || 0,
      giving_sometimes_me: s.giving_sometimes_me || 0,
      giving_not_me: s.giving_not_me || 0,
      
      security_thats_me: s.security_thats_me || 0,
      security_sometimes_me: s.security_sometimes_me || 0,
      security_not_me: s.security_not_me || 0,
      
      dominant_habitudes: s.dominant_habitudes || [],
    };
    const transcript = (msgs || []).map((m: any) => ({ 
      speaker: m.role, 
      text: m.content, 
      ts: m.created_at ? new Date(m.created_at).getTime() : Date.now() 
    }));
    return { 
      session_id: sessionId, 
      profile, 
      transcript, 
      status: s.status,
      cache_name: s.cache_name || null,
      coach_notes: s.coach_notes || '',
      first_impressions: s.first_impressions || ''
    };
}

export async function createNewSession(profile: any) {
  const session = {
    session_id: `sess_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
    profile,
    transcript: []
  };
  await saveSession(session);
  return session;
}

export async function summarizeOldMessages(sessionId: string, messages: any[]) {
  // Create summary of the provided messages
  const messagesToSummarize = messages.map(m => ({
    role: m.speaker,
    content: m.text
  }));
  
  const summary = await summarizeConversation(messagesToSummarize);
  
  // Get current max turn_number
  const { data: maxTurn } = await supa
    .from('session_messages')
    .select('turn_number')
    .eq('session_id', sessionId)
    .order('turn_number', { ascending: false })
    .limit(1)
    .maybeSingle();
  
  const nextTurnNumber = (maxTurn?.turn_number ?? -1) + 1;
  
  // Insert summary as a special message
  await supa.from('session_messages').insert({
    session_id: sessionId,
    role: 'summary',
    content: summary,
    turn_number: nextTurnNumber,
    created_at: new Date().toISOString(),
  });
}

export async function updateSessionCache(sessionId: string, cacheName: string) {
  await supa.from('sessions').update({ cache_name: cacheName }).eq('id', sessionId);
}
