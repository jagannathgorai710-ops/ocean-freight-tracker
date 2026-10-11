import React, { useState, useEffect } from 'react';
import { 
  Mail, Sparkles, CheckCircle2, AlertTriangle, ArrowRight, RefreshCw, 
  Send, FileCode, Check, ShieldCheck, Filter, Play, ExternalLink, Zap
} from 'lucide-react';
import { api } from '../services/api';

export default function EmailParserModule({ currentUser, onDataUpdated }) {
  const [inboxEmails, setInboxEmails] = useState([]);
  const [stats, setStats] = useState({ total: 0, actionable: 0, rateUpdates: 0, shipmentUpdates: 0, skippedOrIrrelevant: 0, appliedCount: 0 });
  const [selectedFilter, setSelectedFilter] = useState('ALL'); // 'ALL', 'RATE_UPDATE', 'SHIPMENT_STATUS', 'SKIPPED', 'APPLIED'
  const [loading, setLoading] = useState(true);
  const [syncingAll, setSyncingAll] = useState(false);
  const [syncSummary, setSyncSummary] = useState(null);

  // Live Playground State
  const [playgroundText, setPlaygroundText] = useState(`From: rates@oceanlinklines.com\nSubject: Special Rate Notice - Nhava Sheva to New York\nDate: 2026-10-02\n\nDear Team,\n\nPlease update our 20ft container rate on Nhava Sheva to New York to USD 2380 effective immediately.\n\nRegards,\nOceanLink Lines`);
  const [playgroundResult, setPlaygroundResult] = useState(null);
  const [playgroundLoading, setPlaygroundLoading] = useState(false);

  useEffect(() => {
    fetchInbox();
  }, []);

  const fetchInbox = async () => {
    setLoading(true);
    try {
      const data = await api.getEmailInbox();
      setInboxEmails(data.emails || []);
      setStats(data.stats || { total: 0, actionable: 0, rateUpdates: 0, shipmentUpdates: 0, skippedOrIrrelevant: 0, appliedCount: 0 });
    } catch (err) {
      console.error('Failed to fetch inbox:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplySingle = async (emailId) => {
    try {
      await api.applyEmailUpdate(emailId);
      fetchInbox();
      if (onDataUpdated) onDataUpdated();
    } catch (err) {
      alert('Error applying update: ' + err.message);
    }
  };

  const handleApplyAll = async () => {
    setSyncingAll(true);
    try {
      const res = await api.applyAllEmails();
      setSyncSummary(res);
      fetchInbox();
      if (onDataUpdated) onDataUpdated();
    } catch (err) {
      alert('Error in batch sync: ' + err.message);
    } finally {
      setSyncingAll(false);
    }
  };

  const handleTestPlayground = async () => {
    setPlaygroundLoading(true);
    try {
      const res = await api.parseRawEmail(playgroundText);
      setPlaygroundResult(res.result);
    } catch (err) {
      alert('Parse error: ' + err.message);
    } finally {
      setPlaygroundLoading(false);
    }
  };

  const filteredEmails = inboxEmails.filter(e => {
    if (selectedFilter === 'ALL') return true;
    if (selectedFilter === 'APPLIED') return e.is_applied === 1;
    if (selectedFilter === 'RATE_UPDATE') return e.action_type === 'RATE_UPDATE';
    if (selectedFilter === 'SHIPMENT_STATUS') return e.action_type === 'SHIPMENT_STATUS';
    if (selectedFilter === 'SKIPPED') return e.action_type === 'SKIPPED_OR_IRRELEVANT';
    return true;
  });

  const cardStyle = {
    background: 'rgba(13, 21, 39, 0.9)',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '16px',
    boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Header Card */}
      <div style={{ ...cardStyle, padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#34d399', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
              <Mail style={{ width: '14px', height: '14px' }} /> Automated Email Parser & Operational NLP Sync
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#fff', margin: 0, fontFamily: 'Outfit, sans-serif' }}>
              Email-Based Rate & Shipment Updates
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '13px', marginTop: '4px' }}>
              Automatically scans plain-text dispatcher emails, extracts revised rates & shipment status changes, and applies database updates.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button onClick={fetchInbox} className="btn-secondary" style={{ fontSize: '12px', padding: '8px 14px' }}>
              <RefreshCw style={{ width: '13px', height: '13px' }} /> Refresh Inbox
            </button>
            <button onClick={handleApplyAll} disabled={syncingAll} className="btn-primary" style={{ fontSize: '12px', padding: '8px 16px' }}>
              {syncingAll ? 'Syncing...' : <><Zap style={{ width: '14px', height: '14px' }} /> Apply All Pending Updates</>}
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginTop: '20px' }}>
          <div style={{ background: '#0a1020', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '14px' }}>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>Total Inbox Parsed</span>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#fff', marginTop: '2px', fontFamily: 'Outfit, sans-serif' }}>{stats.total}</div>
          </div>
          <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '12px', padding: '14px' }}>
            <span style={{ fontSize: '11px', color: '#34d399' }}>Rate Tariff Updates</span>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#34d399', marginTop: '2px', fontFamily: 'Outfit, sans-serif' }}>{stats.rateUpdates}</div>
          </div>
          <div style={{ background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.3)', borderRadius: '12px', padding: '14px' }}>
            <span style={{ fontSize: '11px', color: '#22d3ee' }}>Shipment SLA Alerts</span>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#22d3ee', marginTop: '2px', fontFamily: 'Outfit, sans-serif' }}>{stats.shipmentUpdates}</div>
          </div>
          <div style={{ background: '#0a1020', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '14px' }}>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>Applied to Database</span>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#fff', marginTop: '2px', fontFamily: 'Outfit, sans-serif' }}>{stats.appliedCount}</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Parsed Emails Feed, Right Live NLP Playground */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px', alignItems: 'start' }}>
        
        {/* Left: Email Stream */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
            {[
              { id: 'ALL', label: `All (${inboxEmails.length})` },
              { id: 'RATE_UPDATE', label: 'Rate Updates' },
              { id: 'SHIPMENT_STATUS', label: 'Shipment Status' },
              { id: 'SKIPPED', label: 'Irrelevant / Noise' },
              { id: 'APPLIED', label: 'Applied' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setSelectedFilter(f.id)}
                style={{
                  padding: '6px 14px', borderRadius: '8px', fontSize: '11px', fontWeight: 700, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
                  background: selectedFilter === f.id ? '#10b981' : '#0d1527',
                  color: selectedFilter === f.id ? '#fff' : '#94a3b8',
                  boxShadow: selectedFilter === f.id ? '0 2px 10px rgba(16,185,129,0.3)' : 'none'
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div style={{ ...cardStyle, padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
              <div style={{ width: '28px', height: '28px', border: '3px solid rgba(16,185,129,0.2)', borderTop: '3px solid #10b981', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 12px' }}></div>
              Parsing email stream...
            </div>
          ) : (
            filteredEmails.map(em => {
              const isApplied = em.is_applied === 1;
              const isRate = em.action_type === 'RATE_UPDATE';
              const isShipment = em.action_type === 'SHIPMENT_STATUS';
              return (
                <div
                  key={em.id}
                  style={{
                    ...cardStyle, padding: '18px 20px',
                    borderColor: isApplied ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.08)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'JetBrains Mono, monospace' }}>{em.sender || 'dispatcher'}</span>
                        <span style={{ fontSize: '10px', color: '#64748b' }}>•</span>
                        <span style={{ fontSize: '10px', color: '#64748b' }}>{em.date_received}</span>
                      </div>
                      <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#fff', margin: '3px 0 0' }}>{em.subject}</h4>
                    </div>

                    {isApplied ? (
                      <span style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)', padding: '3px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 700 }}>
                        ✅ APPLIED
                      </span>
                    ) : isRate ? (
                      <span style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)', padding: '3px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 700 }}>
                        Rate Update
                      </span>
                    ) : isShipment ? (
                      <span style={{ background: 'rgba(6,182,212,0.15)', color: '#22d3ee', border: '1px solid rgba(6,182,212,0.3)', padding: '3px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 700 }}>
                        Status Update
                      </span>
                    ) : (
                      <span style={{ background: '#0a1020', color: '#64748b', padding: '3px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 700 }}>
                        Irrelevant
                      </span>
                    )}
                  </div>

                  {/* Body preview */}
                  <div style={{ background: '#060c1c', padding: '10px 12px', borderRadius: '8px', fontSize: '12px', color: '#cbd5e1', fontFamily: 'JetBrains Mono, monospace', whiteSpace: 'pre-wrap', lineHeight: 1.5, marginBottom: '10px' }}>
                    {em.raw_body}
                  </div>

                  {/* Extraction Summary */}
                  {em.parsed_data && (
                    <div style={{ background: '#0a1020', padding: '10px 12px', borderRadius: '8px', fontSize: '11px', color: '#94a3b8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        {isRate && <span>Extracted: <strong style={{ color: '#34d399' }}>${em.parsed_data.new_rate_usd} USD</strong> for {em.parsed_data.origin_port} → {em.parsed_data.destination_port} ({em.parsed_data.container_type})</span>}
                        {isShipment && <span>Extracted: <strong style={{ color: '#22d3ee' }}>{em.parsed_data.new_status}</strong> for Shipment <strong>{em.parsed_data.shipment_id}</strong></span>}
                      </div>

                      {!isApplied && em.action_type !== 'SKIPPED_OR_IRRELEVANT' && (
                        <button onClick={() => handleApplySingle(em.id)} className="btn-primary" style={{ fontSize: '11px', padding: '4px 10px' }}>
                          Apply
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Right: Live Interactive NLP Playground */}
        <div style={{ ...cardStyle, padding: '24px', position: 'sticky', top: '80px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#34d399', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
            <Sparkles style={{ width: '14px', height: '14px' }} /> Live NLP Test Sandbox
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', margin: 0, fontFamily: 'Outfit, sans-serif' }}>
            Test Plain-Text Email Parser
          </h3>
          <p style={{ color: '#94a3b8', fontSize: '12px', marginTop: '4px', marginBottom: '16px' }}>
            Paste any unformatted carrier dispatch email to test pattern extraction and entity recognition.
          </p>

          <textarea
            rows={7}
            value={playgroundText}
            onChange={e => setPlaygroundText(e.target.value)}
            style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', lineHeight: 1.5, resize: 'vertical', marginBottom: '12px' }}
          />

          <button onClick={handleTestPlayground} disabled={playgroundLoading} className="btn-primary" style={{ width: '100%', height: '42px', fontSize: '13px' }}>
            {playgroundLoading ? 'Running Regex & NLP Engine...' : <><Play style={{ width: '14px', height: '14px' }} /> Parse Email Live</>}
          </button>

          {playgroundResult && (
            <div style={{ marginTop: '16px', background: '#0a1020', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Extraction Result</span>
                <span style={{
                  fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px',
                  background: playgroundResult.actionable ? 'rgba(16,185,129,0.15)' : 'rgba(244,63,94,0.15)',
                  color: playgroundResult.actionable ? '#34d399' : '#fb7185'
                }}>
                  {playgroundResult.actionType || 'SKIPPED'}
                </span>
              </div>

              <pre style={{ fontSize: '11px', color: '#e2e8f0', fontFamily: 'JetBrains Mono, monospace', background: '#060c1c', padding: '12px', borderRadius: '8px', overflowX: 'auto' }}>
                {JSON.stringify(playgroundResult.extractedData || playgroundResult, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
