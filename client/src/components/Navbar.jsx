import React from 'react';
import { 
  Ship, Search, Compass, FileCheck, Mail, BarChart3, 
  Table, RefreshCw, Clock, User, Shield, LogOut, KeyRound
} from 'lucide-react';
import { api, setAuthToken, setCurrentUser } from '../services/api';

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  currentUser, 
  onOpenAuth, 
  onOpenPresentation, 
  onOpenDemoGuide,
  currency,
  setCurrency,
  onResetData
}) {
  const navItems = [
    { id: 'rates', label: 'Rate Search', icon: Search },
    { id: 'shipments', label: 'Shipments', icon: Compass },
    { id: 'invoices', label: 'Invoices', icon: FileCheck },
    { id: 'emails', label: 'Email Sync', icon: Mail },
    { id: 'matrix', label: 'Rate Matrix', icon: Table },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'admin', label: 'Admin Console', icon: Shield }
  ];

  const handleLogout = () => {
    setAuthToken(null);
    setCurrentUser(null);
    window.location.reload();
  };

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: 'rgba(6,12,28,0.92)', backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255,255,255,0.06)'
    }}>
      <div style={{
        maxWidth: '1400px', margin: '0 auto', padding: '0 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: '64px', gap: '12px'
      }}>
        {/* Logo */}
        <div 
          onClick={() => setActiveTab('rates')}
          style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', flexShrink: 0 }}
        >
          <div style={{
            width: '38px', height: '38px', borderRadius: '12px',
            background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(16,185,129,0.3)'
          }}>
            <Ship style={{ width: '20px', height: '20px', color: '#fff' }} />
          </div>
          <div>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '15px', color: '#fff', letterSpacing: '-0.02em' }}>
              OCEAN<span style={{ color: '#34d399' }}>FREIGHT</span>
            </div>
            <div style={{ fontSize: '10px', color: '#64748b', marginTop: '-2px' }}>Rate & Shipment Tracker</div>
          </div>
        </div>

        {/* Nav Tabs */}
        <nav style={{
          display: 'flex', alignItems: 'center', gap: '2px',
          background: 'rgba(15,23,42,0.8)', padding: '4px',
          borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)'
        }}>
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '5px',
                  padding: '6px 12px', borderRadius: '8px',
                  fontSize: '12px', fontWeight: 600, border: 'none', cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: isActive ? 'linear-gradient(135deg, #10b981, #059669)' : 'transparent',
                  color: isActive ? '#fff' : '#94a3b8',
                  boxShadow: isActive ? '0 2px 10px rgba(16,185,129,0.3)' : 'none'
                }}
              >
                <Icon style={{ width: '13px', height: '13px' }} />
                <span className="nav-label">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {/* Slides */}
          <button onClick={onOpenPresentation} style={{
            background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)',
            color: '#34d399', fontSize: '11px', fontWeight: 700,
            padding: '6px 9px', borderRadius: '8px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '4px'
          }}>
            <BarChart3 style={{ width: '12px', height: '12px' }} />
            <span>Deck</span>
          </button>

          {/* Tour */}
          <button onClick={onOpenDemoGuide} style={{
            background: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.25)',
            color: '#22d3ee', fontSize: '11px', fontWeight: 700,
            padding: '6px 9px', borderRadius: '8px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '4px'
          }}>
            <Clock style={{ width: '12px', height: '12px' }} />
            <span>Tour</span>
          </button>

          {/* Currency Toggle */}
          <button onClick={() => setCurrency(currency === 'USD' ? 'INR' : 'USD')} style={{
            background: '#0d1527', border: '1px solid rgba(255,255,255,0.1)',
            color: '#cbd5e1', fontSize: '11px', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace',
            padding: '6px 8px', borderRadius: '8px', cursor: 'pointer'
          }}>
            {currency === 'USD' ? '$ USD' : '₹ INR'}
          </button>

          {/* Reset */}
          <button onClick={onResetData} title="Reset Sample Data" style={{
            background: '#0d1527', border: '1px solid rgba(255,255,255,0.1)',
            color: '#94a3b8', padding: '6px', borderRadius: '8px', cursor: 'pointer',
            display: 'flex', alignItems: 'center'
          }}>
            <RefreshCw style={{ width: '13px', height: '13px' }} />
          </button>

          <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.08)', margin: '0 2px' }}></div>

          {/* User / Login button */}
          {currentUser ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div 
                onClick={onOpenAuth}
                title="Click to Switch User / Role"
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer',
                  background: '#0d1527', padding: '5px 10px', borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.1)', fontSize: '11px'
                }}
              >
                <div style={{
                  width: '7px', height: '7px', borderRadius: '50%',
                  background: currentUser.role === 'Admin' ? '#34d399' : '#60a5fa'
                }}></div>
                <span style={{ color: '#fff', fontWeight: 600, maxWidth: '75px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {currentUser.username}
                </span>
                <span style={{ fontSize: '9px', color: '#64748b', fontFamily: 'JetBrains Mono, monospace' }}>
                  ({currentUser.role})
                </span>
              </div>
              <button onClick={handleLogout} title="Logout" style={{
                background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px'
              }}>
                <LogOut style={{ width: '14px', height: '14px' }} />
              </button>
            </div>
          ) : (
            <button onClick={onOpenAuth} className="btn-primary" style={{ fontSize: '11px', padding: '6px 12px' }}>
              <KeyRound style={{ width: '12px', height: '12px' }} /> Sign In
            </button>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 1024px) {
          .nav-label { display: none; }
        }
      `}</style>
    </header>
  );
}
