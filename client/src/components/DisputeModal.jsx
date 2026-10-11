import React, { useState } from 'react';
import { Copy, Check, Download, X, AlertTriangle, FileText } from 'lucide-react';

export default function DisputeModal({ disputeData, data, onClose }) {
  const [copied, setCopied] = useState(false);
  const actualData = disputeData || data;

  if (!actualData) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(actualData.disputeLetter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([actualData.disputeLetter], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `Dispute_${actualData.claimId || 'Notice'}_${Date.now()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const cardStyle = {
    background: 'rgba(13, 21, 39, 0.98)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '16px',
    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7)'
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        style={{ ...cardStyle, maxWidth: '650px', width: '100%', padding: '24px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '14px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(244,63,94,0.15)', border: '1px solid rgba(244,63,94,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fb7185' }}>
              <FileText style={{ width: '18px', height: '18px' }} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                Freight Overcharge Dispute Notice
                <span style={{ fontSize: '10px', fontFamily: 'JetBrains Mono, monospace', background: 'rgba(244,63,94,0.2)', color: '#fb7185', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(244,63,94,0.3)' }}>
                  {actualData.claimId}
                </span>
              </h3>
              <p style={{ fontSize: '11px', color: '#94a3b8', margin: '2px 0 0' }}>Carrier billing dispute notice with legal contract audit reference</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}>
            <X style={{ width: '18px', height: '18px' }} />
          </button>
        </div>

        {/* Notice Body */}
        <div style={{ margin: '16px 0', flex: 1, overflowY: 'auto' }}>
          <pre style={{
            background: '#060c1c', padding: '16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)',
            fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: '#e2e8f0', whiteSpace: 'pre-wrap', lineHeight: 1.6
          }}>
            {actualData.disputeLetter}
          </pre>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontSize: '11px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertTriangle style={{ width: '14px', height: '14px', color: '#fbbf24' }} />
            <span>Formal carrier dispute statement</span>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={handleCopy} className="btn-secondary" style={{ fontSize: '12px', padding: '7px 14px' }}>
              {copied ? <Check style={{ width: '14px', height: '14px', color: '#34d399' }} /> : <Copy style={{ width: '14px', height: '14px' }} />}
              <span>{copied ? 'Copied!' : 'Copy Letter'}</span>
            </button>
            <button onClick={handleDownload} className="btn-primary" style={{ fontSize: '12px', padding: '7px 14px' }}>
              <Download style={{ width: '14px', height: '14px' }} />
              <span>Download (.txt)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
