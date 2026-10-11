import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import RateSearch from './components/RateSearch';
import ShipmentTracker from './components/ShipmentTracker';
import InvoiceChecker from './components/InvoiceChecker';
import EmailParserModule from './components/EmailParserModule';
import RateDirectory from './components/RateDirectory';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import AdminPanel from './components/AdminPanel';
import PresentationSlides from './components/PresentationSlides';
import DemoGuideModal from './components/DemoGuideModal';
import AuthModal from './components/AuthModal';
import { getCurrentUser, api, setAuthToken, setCurrentUser } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('rates');
  const [currentUser, setUser] = useState(null);
  const [currency, setCurrency] = useState('USD');
  const [simulationDate, setSimulationDate] = useState('2026-10-06');
  const [preloadedInvoiceData, setPreloadedInvoiceData] = useState(null);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isPresentationOpen, setIsPresentationOpen] = useState(false);
  const [isDemoGuideOpen, setIsDemoGuideOpen] = useState(false);
  const [dataVersion, setDataVersion] = useState(1);

  useEffect(() => {
    const existing = getCurrentUser();
    if (existing) {
      setUser(existing);
    } else {
      autoLoginDefault();
    }
  }, []);

  const autoLoginDefault = async () => {
    try {
      const res = await api.login('admin@oceanfreight.com', 'admin123');
      setAuthToken(res.token);
      setCurrentUser(res.user);
      setUser(res.user);
    } catch { /* silent */ }
  };

  const handleSelectForInvoice = (data) => {
    setPreloadedInvoiceData(data);
    setActiveTab('invoices');
  };

  const handleResetData = async () => {
    if (!window.confirm('Reset database to the original sample dataset?')) return;
    try {
      await api.resetData();
      setDataVersion(v => v + 1);
    } catch (err) {
      alert('Reset error: ' + err.message);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#060c1c', color: '#f1f5f9' }}>
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenPresentation={() => setIsPresentationOpen(true)}
        onOpenDemoGuide={() => setIsDemoGuideOpen(true)}
        currency={currency}
        setCurrency={setCurrency}
        onResetData={handleResetData}
      />

      <main style={{ flex: 1, maxWidth: '1400px', width: '100%', margin: '0 auto', padding: '24px' }}>
        {activeTab === 'rates' && (
          <RateSearch key={`r-${dataVersion}`} currency={currency} onSelectForInvoice={handleSelectForInvoice} />
        )}
        {activeTab === 'shipments' && (
          <ShipmentTracker key={`s-${dataVersion}`} simulationDate={simulationDate} onSelectForInvoice={handleSelectForInvoice} currentUser={currentUser} />
        )}
        {activeTab === 'invoices' && (
          <InvoiceChecker key={`i-${dataVersion}`} preloadedData={preloadedInvoiceData} currency={currency} />
        )}
        {activeTab === 'emails' && (
          <EmailParserModule key={`e-${dataVersion}`} currentUser={currentUser} onDataUpdated={() => setDataVersion(v => v + 1)} />
        )}
        {activeTab === 'matrix' && (
          <RateDirectory key={`m-${dataVersion}`} currentUser={currentUser} currency={currency} />
        )}
        {activeTab === 'analytics' && (
          <AnalyticsDashboard key={`a-${dataVersion}`} currency={currency} />
        )}
        {activeTab === 'admin' && (
          <AdminPanel key={`adm-${dataVersion}`} currentUser={currentUser} onResetData={() => setDataVersion(v => v + 1)} />
        )}
      </main>

      {/* Footer */}
      <footer style={{
        marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(6,12,28,0.9)', padding: '20px 24px', fontSize: '12px', color: '#64748b'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <span><strong style={{ color: '#e2e8f0' }}>Ocean Freight Tracker</strong> — Intelligent Rate Comparison, Shipment Monitoring & Invoice Audit Platform</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#34d399', animation: 'pulse-glow 2s infinite' }}></div>
            <span style={{ color: '#34d399', fontWeight: 600 }}>All 4 Modules Operational</span>
          </div>
        </div>
      </footer>

      {isPresentationOpen && <PresentationSlides onClose={() => setIsPresentationOpen(false)} />}
      {isDemoGuideOpen && <DemoGuideModal onClose={() => setIsDemoGuideOpen(false)} onNavigateTab={(tab) => { setActiveTab(tab); setIsDemoGuideOpen(false); }} />}
      {isAuthModalOpen && <AuthModal onClose={() => setIsAuthModalOpen(false)} onLoginSuccess={(user) => setUser(user)} />}
    </div>
  );
}
