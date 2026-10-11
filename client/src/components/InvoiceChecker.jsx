import React, { useState, useEffect } from 'react';
import { 
  FileCheck, AlertOctagon, CheckCircle2, DollarSign, ArrowRight, Download, 
  FileText, TrendingUp, AlertTriangle, Sparkles, RefreshCw, ShieldAlert
} from 'lucide-react';
import { api } from '../services/api';
import DisputeModal from './DisputeModal';

export default function InvoiceChecker({ preloadedData, currency = 'USD' }) {
  const [activeTab, setActiveTab] = useState('single'); // 'single' or 'bulk'

  // Single Check Form
  const [shipmentsList, setShipmentsList] = useState([]);
  const [selectedShipmentId, setSelectedShipmentId] = useState('');
  const [carrier, setCarrier] = useState('GlobalMariner');
  const [originPort, setOriginPort] = useState('Mundra');
  const [destinationPort, setDestinationPort] = useState('Los Angeles');
  const [containerType, setContainerType] = useState('40ft');
  const [invoiceAmount, setInvoiceAmount] = useState('4200');

  const [singleResult, setSingleResult] = useState(null);
  const [singleLoading, setSingleLoading] = useState(false);
  const [singleError, setSingleError] = useState(null);

  // Bulk Audit
  const [bulkData, setBulkData] = useState(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkFilter, setBulkFilter] = useState('ALL'); // 'ALL', 'OVERCHARGED', 'CORRECT'

  // Dispute Letter Modal
  const [disputeModalData, setDisputeModalData] = useState(null);
  const [isDisputeOpen, setIsDisputeOpen] = useState(false);

  useEffect(() => {
    fetchShipmentOptions();
    if (preloadedData) {
      if (preloadedData.shipment_id) setSelectedShipmentId(preloadedData.shipment_id);
      if (preloadedData.carrier) setCarrier(preloadedData.carrier);
      if (preloadedData.origin_port) setOriginPort(preloadedData.origin_port);
      if (preloadedData.destination_port) setDestinationPort(preloadedData.destination_port);
      if (preloadedData.container_type) setContainerType(preloadedData.container_type);
      if (preloadedData.invoice_amount_usd) setInvoiceAmount(preloadedData.invoice_amount_usd.toString());
      else if (preloadedData.rate_usd) setInvoiceAmount((preloadedData.rate_usd * 1.1).toFixed(0)); // Simulate an overcharge test
    }
  }, [preloadedData]);

  const fetchShipmentOptions = async () => {
    try {
      const data = await api.getShipments();
      if (data.shipments) setShipmentsList(data.shipments);
    } catch (err) { console.error(err); }
  };

  const handleShipmentSelect = (e) => {
    const sId = e.target.value;
    setSelectedShipmentId(sId);
    if (!sId) return;

    const shp = shipmentsList.find(s => s.shipment_id === sId);
    if (shp) {
      setCarrier(shp.carrier);
      setOriginPort(shp.origin_port);
      setDestinationPort(shp.destination_port);
      setContainerType(shp.container_type);
      if (shp.invoice_amount_usd) setInvoiceAmount(shp.invoice_amount_usd.toString());
    }
  };

  const handleSingleCheck = async (e) => {
    e.preventDefault();
    if (!invoiceAmount || isNaN(invoiceAmount) || parseFloat(invoiceAmount) <= 0) {
      setSingleError('Please enter a valid invoice amount');
      return;
    }

    setSingleLoading(true);
    setSingleError(null);
    try {
      const payload = {
        shipmentId: selectedShipmentId || null,
        carrier,
        originPort,
        destinationPort,
        containerType,
        invoiceAmountUsd: parseFloat(invoiceAmount)
      };

      const result = await api.checkInvoice(payload);
      setSingleResult(result);
    } catch (err) {
      setSingleError(err.message || 'Failed to verify invoice');
      setSingleResult(null);
    } finally {
      setSingleLoading(false);
    }
  };

  const handleGenerateDispute = async (resultObj) => {
    try {
      const res = await api.generateDisputeLetter({
        shipmentId: resultObj.shipmentId || resultObj.shipment_id,
        carrier: resultObj.carrier,
        originPort: resultObj.originPort || resultObj.origin_port,
        destinationPort: resultObj.destinationPort || resultObj.destination_port,
        containerType: resultObj.containerType || resultObj.container_type,
        contractedRateUsd: resultObj.contractedRateUsd,
        invoicedAmountUsd: resultObj.invoicedAmountUsd || resultObj.invoice_amount_usd,
        discrepancyUsd: resultObj.differenceUsd || resultObj.discrepancyUsd,
        percentageVariance: resultObj.percentageVariance
      });
      setDisputeModalData(res);
      setIsDisputeOpen(true);
    } catch (err) {
      alert('Error generating dispute letter: ' + err.message);
    }
  };

  const fetchBulkAudit = async () => {
    setBulkLoading(true);
    try {
      const data = await api.auditAllInvoices();
      setBulkData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setBulkLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'bulk' && !bulkData) {
      fetchBulkAudit();
    }
  }, [activeTab]);

  const formatPrice = (usd) => currency === 'INR' ? `₹${Math.round(usd * 84.50).toLocaleString()}` : `$${Number(usd).toLocaleString()}`;

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
              <ShieldAlert style={{ width: '14px', height: '14px' }} /> Automated Freight Audit & Discrepancy Flagging
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#fff', margin: 0, fontFamily: 'Outfit, sans-serif' }}>
              Ocean Freight Invoice Checker
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '13px', marginTop: '4px' }}>
              Cross-references carrier invoice billings against contracted master tariffs to immediately identify overcharges and generate dispute notices.
            </p>
          </div>

          {/* Tab Switcher */}
          <div style={{ display: 'flex', background: '#0a1020', padding: '4px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <button
              onClick={() => setActiveTab('single')}
              style={{
                padding: '8px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                background: activeTab === 'single' ? '#10b981' : 'transparent',
                color: activeTab === 'single' ? '#fff' : '#94a3b8'
              }}
            >
              Single Invoice Audit
            </button>
            <button
              onClick={() => setActiveTab('bulk')}
              style={{
                padding: '8px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                background: activeTab === 'bulk' ? '#10b981' : 'transparent',
                color: activeTab === 'bulk' ? '#fff' : '#94a3b8'
              }}
            >
              Fleet Bulk Audit Matrix
            </button>
          </div>
        </div>
      </div>

      {/* SINGLE INVOICE AUDIT TAB */}
      {activeTab === 'single' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px', alignItems: 'start' }}>
          
          {/* Form */}
          <div style={{ ...cardStyle, padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText style={{ width: '16px', height: '16px', color: '#10b981' }} /> Enter or Select Shipment Invoice
            </h3>

            {singleError && (
              <div style={{ padding: '12px', background: 'rgba(244,63,94,0.1)', color: '#fb7185', border: '1px solid rgba(244,63,94,0.3)', borderRadius: '10px', fontSize: '12px', marginBottom: '16px' }}>
                {singleError}
              </div>
            )}

            <form onSubmit={handleSingleCheck} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  Quick Select from Tracked Shipments (or fill manually below)
                </label>
                <select value={selectedShipmentId} onChange={handleShipmentSelect}>
                  <option value="">-- Choose a shipment to prefill (e.g. SHP1003, SHP1006, SHP1010) --</option>
                  {shipmentsList.map(s => (
                    <option key={s.shipment_id} value={s.shipment_id}>
                      {s.shipment_id} • {s.carrier} ({s.origin_port} → {s.destination_port}) - Billed: ${s.invoice_amount_usd || 'N/A'}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Carrier Name</label>
                  <select value={carrier} onChange={e => setCarrier(e.target.value)}>
                    <option value="OceanLink Lines">OceanLink Lines</option>
                    <option value="PacificStar Line">PacificStar Line</option>
                    <option value="BlueWave Shipping">BlueWave Shipping</option>
                    <option value="GlobalMariner">GlobalMariner</option>
                    <option value="AtlasSea Carriers">AtlasSea Carriers</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Container Type</label>
                  <select value={containerType} onChange={e => setContainerType(e.target.value)}>
                    <option value="20ft">20ft Container</option>
                    <option value="40ft">40ft Container</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Origin Port</label>
                  <select value={originPort} onChange={e => setOriginPort(e.target.value)}>
                    <option value="Nhava Sheva">Nhava Sheva</option>
                    <option value="Mundra">Mundra</option>
                    <option value="Chennai">Chennai</option>
                    <option value="Kolkata">Kolkata</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Destination Port</label>
                  <select value={destinationPort} onChange={e => setDestinationPort(e.target.value)}>
                    <option value="Los Angeles">Los Angeles</option>
                    <option value="New York">New York</option>
                    <option value="Savannah">Savannah</option>
                    <option value="Houston">Houston</option>
                    <option value="Long Beach">Long Beach</option>
                    <option value="Norfolk">Norfolk</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  Billed / Invoiced Amount ({currency === 'USD' ? 'USD $' : 'INR ₹'}) *
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '12px', top: '10px', color: '#64748b', fontWeight: 700 }}>$</span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 4200"
                    value={invoiceAmount}
                    onChange={e => setInvoiceAmount(e.target.value)}
                    style={{ paddingLeft: '28px', fontSize: '15px', fontWeight: 700 }}
                    required
                  />
                </div>
              </div>

              <button type="submit" disabled={singleLoading} className="btn-primary" style={{ marginTop: '8px', height: '44px', fontSize: '13px' }}>
                {singleLoading ? 'Verifying against Master Tariff...' : <><FileCheck style={{ width: '16px', height: '16px' }} /> Verify Against Contract Rate</>}
              </button>
            </form>
          </div>

          {/* Audit Result Display */}
          <div>
            {singleResult ? (
              <div style={{
                ...cardStyle, padding: '24px',
                borderColor: singleResult.status === 'OVERCHARGED' ? 'rgba(244,63,94,0.4)' : 'rgba(16,185,129,0.4)',
                background: singleResult.status === 'OVERCHARGED'
                  ? 'linear-gradient(135deg, rgba(244,63,94,0.08) 0%, rgba(13,21,39,0.95) 100%)'
                  : 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(13,21,39,0.95) 100%)'
              }}>
                {/* Result Status Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  {singleResult.status === 'OVERCHARGED' ? (
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(244,63,94,0.15)', border: '1px solid rgba(244,63,94,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fb7185' }}>
                      <AlertOctagon style={{ width: '22px', height: '22px' }} />
                    </div>
                  ) : (
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34d399' }}>
                      <CheckCircle2 style={{ width: '22px', height: '22px' }} />
                    </div>
                  )}
                  <div>
                    <span style={{
                      fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em',
                      color: singleResult.status === 'OVERCHARGED' ? '#fb7185' : '#34d399'
                    }}>
                      {singleResult.status === 'OVERCHARGED' ? '⚠️ OVERCHARGE DETECTED' : '✅ INVOICE VERIFIED MATCH'}
                    </span>
                    <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', margin: 0, fontFamily: 'Outfit, sans-serif' }}>
                      {singleResult.carrier} • {singleResult.containerType}
                    </h3>
                  </div>
                </div>

                {/* Corridor & Details */}
                <div style={{ fontSize: '13px', color: '#cbd5e1', marginBottom: '16px', background: '#0a1020', padding: '10px 14px', borderRadius: '8px' }}>
                  Route: <strong style={{ color: '#fff' }}>{singleResult.originPort} → {singleResult.destinationPort}</strong>
                </div>

                {/* Financial Comparison Box */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                  <div style={{ background: '#0a1020', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Contracted Tariff</span>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: '#fff', marginTop: '2px', fontFamily: 'JetBrains Mono, monospace' }}>
                      {formatPrice(singleResult.contractedRateUsd)}
                    </div>
                  </div>
                  <div style={{ background: '#0a1020', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Invoiced Amount</span>
                    <div style={{
                      fontSize: '20px', fontWeight: 800, marginTop: '2px', fontFamily: 'JetBrains Mono, monospace',
                      color: singleResult.status === 'OVERCHARGED' ? '#fb7185' : '#34d399'
                    }}>
                      {formatPrice(singleResult.invoicedAmountUsd)}
                    </div>
                  </div>
                </div>

                {/* Variance Bar */}
                <div style={{ padding: '12px', borderRadius: '10px', background: singleResult.status === 'OVERCHARGED' ? 'rgba(244,63,94,0.1)' : 'rgba(16,185,129,0.1)', border: `1px solid ${singleResult.status === 'OVERCHARGED' ? 'rgba(244,63,94,0.2)' : 'rgba(16,185,129,0.2)'}`, marginBottom: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700 }}>
                    <span style={{ color: singleResult.status === 'OVERCHARGED' ? '#fb7185' : '#34d399' }}>
                      {singleResult.status === 'OVERCHARGED' ? `Discrepancy: +${formatPrice(singleResult.differenceUsd)}` : 'Zero Discrepancy (Accurate)'}
                    </span>
                    <span style={{ color: singleResult.status === 'OVERCHARGED' ? '#fb7185' : '#34d399', fontFamily: 'JetBrains Mono, monospace' }}>
                      {singleResult.percentageVariance > 0 ? `+${singleResult.percentageVariance}%` : '0%'}
                    </span>
                  </div>
                </div>

                {/* Action button if overcharged */}
                {singleResult.status === 'OVERCHARGED' && (
                  <button onClick={() => handleGenerateDispute(singleResult)} className="btn-primary" style={{
                    width: '100%', background: 'linear-gradient(135deg, #f43f5e, #be123c)', boxShadow: '0 4px 14px rgba(244,63,94,0.3)', fontSize: '13px'
                  }}>
                    <FileText style={{ width: '15px', height: '15px' }} /> Generate Dispute Notice Letter
                  </button>
                )}
              </div>
            ) : (
              <div style={{ ...cardStyle, padding: '40px 24px', textAlign: 'center', color: '#64748b' }}>
                <FileCheck style={{ width: '36px', height: '36px', color: '#1a2744', margin: '0 auto 12px' }} />
                <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#94a3b8' }}>Ready for Freight Audit</h4>
                <p style={{ fontSize: '12px', marginTop: '6px', maxWidth: '300px', margin: '6px auto 0' }}>
                  Submit the form on the left or click a shipment from the dropdown to run an instant contract audit.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FLEET BULK AUDIT TAB */}
      {activeTab === 'bulk' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {bulkLoading || !bulkData ? (
            <div style={{ ...cardStyle, padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
              <div style={{ width: '28px', height: '28px', border: '3px solid rgba(16,185,129,0.2)', borderTop: '3px solid #10b981', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 12px' }}></div>
              Auditing all fleet shipments against contracted master rate cards...
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                <div style={{ ...cardStyle, padding: '16px' }}>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>Total Audited</span>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: '#fff', marginTop: '4px', fontFamily: 'Outfit, sans-serif' }}>{bulkData.summary.totalAudited}</div>
                </div>
                <div style={{ ...cardStyle, padding: '16px', background: 'rgba(244,63,94,0.08)', borderColor: 'rgba(244,63,94,0.3)' }}>
                  <span style={{ fontSize: '11px', color: '#fb7185' }}>Overcharged Shipments</span>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: '#fb7185', marginTop: '4px', fontFamily: 'Outfit, sans-serif' }}>{bulkData.summary.overchargedCount}</div>
                </div>
                <div style={{ ...cardStyle, padding: '16px', background: 'rgba(244,63,94,0.12)', borderColor: 'rgba(244,63,94,0.4)' }}>
                  <span style={{ fontSize: '11px', color: '#fb7185' }}>Total Recoverable Funds</span>
                  <div style={{ fontSize: '24px', fontWeight: 900, color: '#fb7185', marginTop: '4px', fontFamily: 'Outfit, sans-serif' }}>{formatPrice(bulkData.summary.totalOverchargedUsd)}</div>
                </div>
                <div style={{ ...cardStyle, padding: '16px', background: 'rgba(16,185,129,0.08)', borderColor: 'rgba(16,185,129,0.3)' }}>
                  <span style={{ fontSize: '11px', color: '#34d399' }}>Clean Invoices</span>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: '#34d399', marginTop: '4px', fontFamily: 'Outfit, sans-serif' }}>{bulkData.summary.correctCount}</div>
                </div>
              </div>

              {/* Table Card */}
              <div style={{ ...cardStyle, padding: '20px', overflowX: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>Detailed Invoice Verification Matrix</div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {['ALL', 'OVERCHARGED', 'CORRECT'].map(st => (
                      <button
                        key={st}
                        onClick={() => setBulkFilter(st)}
                        style={{
                          padding: '5px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, border: 'none', cursor: 'pointer',
                          background: bulkFilter === st ? '#10b981' : '#0d1527',
                          color: bulkFilter === st ? '#fff' : '#94a3b8'
                        }}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                <table>
                  <thead>
                    <tr>
                      <th>Shipment</th>
                      <th>Carrier</th>
                      <th>Route</th>
                      <th>Contract Rate</th>
                      <th>Billed</th>
                      <th>Variance</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bulkData.auditResults
                      .filter(r => bulkFilter === 'ALL' || r.status === bulkFilter)
                      .map(r => (
                        <tr key={r.shipment_id}>
                          <td style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: '#fff' }}>{r.shipment_id}</td>
                          <td>{r.carrier} ({r.container_type})</td>
                          <td>{r.origin_port} → {r.destination_port}</td>
                          <td style={{ fontFamily: 'JetBrains Mono, monospace' }}>{formatPrice(r.contractedRateUsd)}</td>
                          <td style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: r.status === 'OVERCHARGED' ? '#fb7185' : '#fff' }}>
                            {formatPrice(r.invoicedAmountUsd)}
                          </td>
                          <td style={{ fontFamily: 'JetBrains Mono, monospace', color: r.status === 'OVERCHARGED' ? '#fb7185' : '#34d399' }}>
                            {r.discrepancyUsd > 0 ? `+${formatPrice(r.discrepancyUsd)} (+${r.percentageVariance}%)` : '$0 (0%)'}
                          </td>
                          <td>
                            {r.status === 'OVERCHARGED' ? (
                              <span className="badge-status badge-delayed">Overcharged</span>
                            ) : (
                              <span className="badge-status badge-delivered">Match</span>
                            )}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            {r.status === 'OVERCHARGED' ? (
                              <button onClick={() => handleGenerateDispute(r)} style={{
                                background: 'rgba(244,63,94,0.15)', border: '1px solid rgba(244,63,94,0.3)', color: '#fb7185',
                                fontSize: '11px', fontWeight: 700, padding: '4px 8px', borderRadius: '6px', cursor: 'pointer'
                              }}>
                                Dispute
                              </button>
                            ) : (
                              <span style={{ color: '#64748b', fontSize: '11px' }}>OK</span>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* Dispute Letter Modal */}
      {isDisputeOpen && disputeModalData && (
        <DisputeModal
          data={disputeModalData}
          onClose={() => setIsDisputeOpen(false)}
        />
      )}
    </div>
  );
}
