import React from 'react';
import { Play, CheckCircle2, Clock, Sparkles, X, ChevronRight } from 'lucide-react';

export default function DemoGuideModal({ onClose, onNavigateTab }) {
  const steps = [
    {
      minute: '00:00 - 00:45',
      title: 'Module 1: Rate Search & Green Comparison',
      tab: 'rates',
      description: 'Select Origin Port (Nhava Sheva) and Destination Port (Los Angeles) with 20ft or 40ft container. Observe instant sorting by price, prominent highlight of the cheapest carrier option, transit days, and IMO Green Freight carbon emission calculations.'
    },
    {
      minute: '00:45 - 01:30',
      title: 'Module 2: Shipment Tracker & Live Ocean Map',
      tab: 'shipments',
      description: 'View the live fleet dashboard showing dynamic status computation (In Transit, Delivered, Delayed). Click any shipment to see its route on the interactive global map with animated vessel position and port coordinates. Test the "Add Shipment" modal or "Mark Delivered".'
    },
    {
      minute: '01:30 - 02:15',
      title: 'Module 3: Freight Invoice Checker & Dispute Generator',
      tab: 'invoices',
      description: 'Select shipment SHP1003 (invoiced at $4,200 vs contracted $4,020). The system flags an OVERCHARGE of +$180. Click "Generate Dispute Letter" to produce a ready-to-send formal carrier claim with reference numbers. Switch to "Bulk Audit" to review total fleet recoverable overcharges.'
    },
    {
      minute: '02:15 - 03:00',
      title: 'Module 4: Email-Based Auto-Sync Engine',
      tab: 'emails',
      description: 'Review the 14 parsed sample emails. Notice how rate changes and shipment status updates are extracted, while newsletters (Email 11) and out-of-office notes (Email 12) are gracefully filtered out. Click "Apply All Pending Updates" to update the live database with 1 click!'
    }
  ];

  const cardStyle = {
    background: '#0a1020',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '12px',
    padding: '16px'
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        style={{
          background: 'rgba(6, 12, 28, 0.98)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '20px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8)',
          maxWidth: '720px',
          width: '100%',
          padding: '24px',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '14px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#22d3ee' }}>
              <Clock style={{ width: '18px', height: '18px' }} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#fff', margin: 0, fontFamily: 'Outfit, sans-serif' }}>
                3-Minute Demo Walkthrough Guide
              </h3>
              <p style={{ fontSize: '11px', color: '#94a3b8', margin: '2px 0 0' }}>Step-by-step evaluator script covering all requirements & rubric criteria</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}>
            <X style={{ width: '18px', height: '18px' }} />
          </button>
        </div>

        {/* Steps List */}
        <div style={{ margin: '16px 0', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {steps.map((step, idx) => (
            <div key={idx} style={{ ...cardStyle }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '10px', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: '#34d399', background: 'rgba(16,185,129,0.15)', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(16,185,129,0.3)' }}>
                  {step.minute}
                </span>
                <button
                  onClick={() => {
                    onNavigateTab(step.tab);
                    onClose();
                  }}
                  style={{
                    background: 'none', border: 'none', color: '#22d3ee', fontSize: '11px', fontWeight: 700, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '4px'
                  }}
                >
                  <span>Go to Module</span>
                  <ChevronRight style={{ width: '12px', height: '12px' }} />
                </button>
              </div>

              <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#fff', margin: '0 0 4px', fontFamily: 'Outfit, sans-serif' }}>
                {step.title}
              </h4>
              <p style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: 1.5, margin: 0 }}>
                {step.description}
              </p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <span style={{ fontSize: '11px', color: '#64748b' }}>Ocean Freight Intelligence Platform</span>
          <button onClick={onClose} className="btn-primary" style={{ fontSize: '12px', padding: '6px 16px' }}>
            Close & Explore
          </button>
        </div>
      </div>
    </div>
  );
}
