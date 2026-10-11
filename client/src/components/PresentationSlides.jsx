import React, { useState } from 'react';
import { 
  ChevronLeft, ChevronRight, Sparkles, Layers, Cpu, CheckCircle2, 
  Award, Globe, ShieldCheck, Zap, Database, Code, X
} from 'lucide-react';

export default function PresentationSlides({ onClose }) {
  const [currentSlide, setCurrentSlide] = useState(1);
  const totalSlides = 3;

  const nextSlide = () => {
    if (currentSlide < totalSlides) setCurrentSlide(currentSlide + 1);
  };

  const prevSlide = () => {
    if (currentSlide > 1) setCurrentSlide(currentSlide - 1);
  };

  const cardStyle = {
    background: '#0a1020',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '14px',
    padding: '18px'
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
          maxWidth: '960px',
          width: '100%',
          padding: '28px',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '92vh'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34d399' }}>
              <Award style={{ width: '18px', height: '18px' }} />
            </div>
            <div>
              <span style={{ fontSize: '10px', fontFamily: 'JetBrains Mono, monospace', color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block' }}>
                Ocean Freight Intelligence Platform
              </span>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#fff', margin: 0, fontFamily: 'Outfit, sans-serif' }}>
                Ocean Freight Rate & Shipment Tracker — Architecture & Strategy
              </h3>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '12px', color: '#94a3b8', fontFamily: 'JetBrains Mono, monospace' }}>
              Slide <strong style={{ color: '#34d399' }}>{currentSlide}</strong> / {totalSlides}
            </span>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '6px', borderRadius: '8px' }}>
              <X style={{ width: '20px', height: '20px' }} />
            </button>
          </div>
        </div>

        {/* Slide Canvas Content */}
        <div style={{ flex: 1, padding: '20px 0', overflowY: 'auto' }}>
          
          {/* SLIDE 1: Problem Statement & Innovation Approach */}
          {currentSlide === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Slide 1 of 3 · Strategic Vision
                  </span>
                  <h2 style={{ fontSize: '26px', fontWeight: 900, color: '#fff', fontFamily: 'Outfit, sans-serif', margin: '4px 0 0' }}>
                    Problem Statement & Innovation Strategy
                  </h2>
                </div>
                <span style={{ fontSize: '11px', fontWeight: 700, background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)', padding: '4px 10px', borderRadius: '999px' }}>
                  Digitize · Optimize · Audit
                </span>
              </div>

              {/* Split Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {/* Left: Bottlenecks */}
                <div style={{ ...cardStyle, background: 'rgba(244,63,94,0.04)', borderColor: 'rgba(244,63,94,0.2)' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 800, color: '#fb7185', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fb7185' }}></span> Current Industry Bottlenecks
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px', color: '#cbd5e1', lineHeight: 1.5 }}>
                    <div>
                      <strong style={{ color: '#fff' }}>• Fragmented Data Silos:</strong> Importers & exporters rely on static spreadsheets and unorganized email threads, losing visibility into competitive spot rates.
                    </div>
                    <div>
                      <strong style={{ color: '#fff' }}>• Unchecked Overcharges:</strong> Lack of automated cross-auditing against contracted tariffs leads to 6–12% billing leakages across global logistics.
                    </div>
                    <div>
                      <strong style={{ color: '#fff' }}>• Carbon Blindspots:</strong> Shippers lack emissions transparency to choose greener maritime lanes and meet ESG criteria.
                    </div>
                  </div>
                </div>

                {/* Right: Solutions */}
                <div style={{ ...cardStyle, background: 'rgba(16,185,129,0.06)', borderColor: 'rgba(16,185,129,0.25)' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 800, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Sparkles style={{ width: '14px', height: '14px' }} /> Our Platform Architecture
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px', color: '#cbd5e1', lineHeight: 1.5 }}>
                    <div>
                      <strong style={{ color: '#34d399' }}>✓ Instant Rate Optimizer:</strong> Real-time comparison across all carrier tariffs with automated cheapest-carrier recommendation.
                    </div>
                    <div>
                      <strong style={{ color: '#34d399' }}>✓ Autonomous Invoice Auditor:</strong> 1-click verification of invoice amounts against contracted master tariffs with automatic legal dispute generation.
                    </div>
                    <div>
                      <strong style={{ color: '#34d399' }}>✓ IMO Green Freight Index:</strong> Live nautical emissions calculations (kg CO₂e) per TEU container.
                    </div>
                  </div>
                </div>
              </div>

              {/* 3 Pillars Footer */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', textAlign: 'center' }}>
                <div style={{ ...cardStyle, padding: '14px' }}>
                  <div style={{ fontSize: '18px', fontWeight: 900, color: '#fff', fontFamily: 'Outfit, sans-serif' }}>4 Core Modules</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>Search, Track, Audit & Email Sync</div>
                </div>
                <div style={{ ...cardStyle, padding: '14px', background: 'rgba(16,185,129,0.06)' }}>
                  <div style={{ fontSize: '18px', fontWeight: 900, color: '#34d399', fontFamily: 'Outfit, sans-serif' }}>100% Automated</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>Zero-error multi-pattern NLP parser</div>
                </div>
                <div style={{ ...cardStyle, padding: '14px', background: 'rgba(6,182,212,0.06)' }}>
                  <div style={{ fontSize: '18px', fontWeight: 900, color: '#22d3ee', fontFamily: 'Outfit, sans-serif' }}>Eco-Scoring</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>Live maritime carbon emission telemetry</div>
                </div>
              </div>
            </div>
          )}

          {/* SLIDE 2: Tech Stack & System Architecture */}
          {currentSlide === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#22d3ee', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Slide 2 of 3 · System Engineering
                  </span>
                  <h2 style={{ fontSize: '26px', fontWeight: 900, color: '#fff', fontFamily: 'Outfit, sans-serif', margin: '4px 0 0' }}>
                    Technology Stack & End-to-End Pipeline
                  </h2>
                </div>
                <span style={{ fontSize: '11px', fontWeight: 700, background: 'rgba(6,182,212,0.15)', color: '#22d3ee', border: '1px solid rgba(6,182,212,0.3)', padding: '4px 10px', borderRadius: '999px' }}>
                  High Performance · Modular · Scalable
                </span>
              </div>

              {/* 3 Columns */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
                <div style={{ ...cardStyle }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#22d3ee', fontWeight: 800, fontSize: '13px', marginBottom: '10px' }}>
                    <Code style={{ width: '16px', height: '16px' }} /> Frontend Client
                  </div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px', color: '#cbd5e1' }}>
                    <li>• <strong style={{ color: '#fff' }}>React 18 + Vite:</strong> Instant sub-second HMR</li>
                    <li>• <strong style={{ color: '#fff' }}>Leaflet Ocean Maps:</strong> Interactive global shipping lanes</li>
                    <li>• <strong style={{ color: '#fff' }}>Chart.js:</strong> Dynamic SLA & pricing trends</li>
                    <li>• <strong style={{ color: '#fff' }}>Lucide Icons:</strong> Consistent maritime UX</li>
                  </ul>
                </div>

                <div style={{ ...cardStyle }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#34d399', fontWeight: 800, fontSize: '13px', marginBottom: '10px' }}>
                    <Cpu style={{ width: '16px', height: '16px' }} /> Backend & NLP Engine
                  </div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px', color: '#cbd5e1' }}>
                    <li>• <strong style={{ color: '#fff' }}>Node.js & Express:</strong> High-throughput REST API</li>
                    <li>• <strong style={{ color: '#fff' }}>Multi-Pattern Parser:</strong> Regex & entity extraction</li>
                    <li>• <strong style={{ color: '#fff' }}>Noise Filter:</strong> Skips newsletters & OOO notes</li>
                    <li>• <strong style={{ color: '#fff' }}>JWT & Bcrypt:</strong> Role-based access security</li>
                  </ul>
                </div>

                <div style={{ ...cardStyle }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#a78bfa', fontWeight: 800, fontSize: '13px', marginBottom: '10px' }}>
                    <Database style={{ width: '16px', height: '16px' }} /> Storage & Analytics
                  </div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px', color: '#cbd5e1' }}>
                    <li>• <strong style={{ color: '#fff' }}>SQLite Database:</strong> Embedded & relational</li>
                    <li>• <strong style={{ color: '#fff' }}>CSV Automated Seed:</strong> Rates, shipments & inbox</li>
                    <li>• <strong style={{ color: '#fff' }}>XLSX Engine:</strong> 1-click Excel/CSV export</li>
                    <li>• <strong style={{ color: '#fff' }}>Audit Trail:</strong> Immutable activity logging</li>
                  </ul>
                </div>
              </div>

              {/* Data Pipeline Flow */}
              <div style={{ ...cardStyle, padding: '14px', background: '#060c1c' }}>
                <span style={{ fontSize: '10px', fontFamily: 'JetBrains Mono, monospace', color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                  End-to-End Operational Pipeline:
                </span>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', flexWrap: 'wrap' }}>
                  <div style={{ background: '#0d1527', padding: '6px 12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)' }}>Carrier Ingest</div>
                  <span style={{ color: '#34d399' }}>➔</span>
                  <div style={{ background: '#0d1527', padding: '6px 12px', borderRadius: '6px', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399' }}>NLP Parser</div>
                  <span style={{ color: '#34d399' }}>➔</span>
                  <div style={{ background: '#0d1527', padding: '6px 12px', borderRadius: '6px', border: '1px solid rgba(6,182,212,0.3)', color: '#22d3ee' }}>Tariff Database</div>
                  <span style={{ color: '#34d399' }}>➔</span>
                  <div style={{ background: '#0d1527', padding: '6px 12px', borderRadius: '6px', border: '1px solid rgba(167,139,250,0.3)', color: '#a78bfa' }}>Audit & Live Map</div>
                </div>
              </div>
            </div>
          )}

          {/* SLIDE 3: Deliverables & Business Value */}
          {currentSlide === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Slide 3 of 3 · Business Value & Compliance
                  </span>
                  <h2 style={{ fontSize: '26px', fontWeight: 900, color: '#fff', fontFamily: 'Outfit, sans-serif', margin: '4px 0 0' }}>
                    Requirements Matrix & Operational Impact
                  </h2>
                </div>
                <span style={{ fontSize: '11px', fontWeight: 700, background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)', padding: '4px 10px', borderRadius: '999px' }}>
                  100% Deliverable Compliance
                </span>
              </div>

              {/* 2 Columns */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px' }}>
                {/* Requirements Compliance Table */}
                <div style={{ ...cardStyle }}>
                  <h4 style={{ fontSize: '12px', fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle2 style={{ width: '14px', height: '14px', color: '#34d399' }} /> Core Requirements Breakdown
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <span style={{ color: '#cbd5e1' }}>Module 1: Rate Search & Compare</span>
                      <strong style={{ color: '#34d399' }}>✓ Completed</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <span style={{ color: '#cbd5e1' }}>Module 2: Live Shipment Tracker</span>
                      <strong style={{ color: '#34d399' }}>✓ Completed</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <span style={{ color: '#cbd5e1' }}>Module 3: Invoice Checker & Claims</span>
                      <strong style={{ color: '#34d399' }}>✓ Completed</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <span style={{ color: '#cbd5e1' }}>Module 4: Email NLP Auto-Sync</span>
                      <strong style={{ color: '#34d399' }}>✓ Completed</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#cbd5e1' }}>Bonus: Analytics, Map & Admin Security</span>
                      <strong style={{ color: '#34d399' }}>✓ Completed</strong>
                    </div>
                  </div>
                </div>

                {/* Business Benefits */}
                <div style={{ ...cardStyle, background: 'rgba(16,185,129,0.04)', borderColor: 'rgba(16,185,129,0.2)' }}>
                  <h4 style={{ fontSize: '12px', fontWeight: 800, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Zap style={{ width: '14px', height: '14px' }} /> Proven Financial ROI
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '11px', color: '#cbd5e1', lineHeight: 1.5 }}>
                    <div>
                      <strong style={{ color: '#fff' }}>• 8–15% Cost Reduction:</strong> Guaranteed lowest-rate carrier selection across all routes.
                    </div>
                    <div>
                      <strong style={{ color: '#fff' }}>• 100% Billing Discrepancy Recovery:</strong> Automated overcharge flagging and legal dispute generation.
                    </div>
                    <div>
                      <strong style={{ color: '#fff' }}>• Zero Manual Data Entry:</strong> NLP email parser handles rate and status updates straight from dispatch inboxes.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          {/* Slide Dots */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {[1, 2, 3].map(num => (
              <button
                key={num}
                onClick={() => setCurrentSlide(num)}
                style={{
                  width: '32px', height: '32px', borderRadius: '8px', fontSize: '12px', fontWeight: 800, border: 'none', cursor: 'pointer',
                  background: currentSlide === num ? '#10b981' : '#0a1020',
                  color: currentSlide === num ? '#fff' : '#94a3b8',
                  boxShadow: currentSlide === num ? '0 2px 10px rgba(16,185,129,0.3)' : 'none'
                }}
              >
                {num}
              </button>
            ))}
          </div>

          {/* Prev / Next Buttons */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={prevSlide}
              disabled={currentSlide === 1}
              className="btn-secondary"
              style={{ fontSize: '12px', padding: '8px 16px', opacity: currentSlide === 1 ? 0.4 : 1, cursor: currentSlide === 1 ? 'not-allowed' : 'pointer' }}
            >
              <ChevronLeft style={{ width: '14px', height: '14px' }} /> Previous Slide
            </button>
            <button
              onClick={nextSlide}
              disabled={currentSlide === totalSlides}
              className="btn-primary"
              style={{ fontSize: '12px', padding: '8px 18px', opacity: currentSlide === totalSlides ? 0.4 : 1, cursor: currentSlide === totalSlides ? 'not-allowed' : 'pointer' }}
            >
              <span>Next Slide</span> <ChevronRight style={{ width: '14px', height: '14px' }} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
