import React, { useState, useEffect } from 'react';
import { 
  Ship, Plus, Search, Filter, Calendar, MapPin, CheckCircle, Clock, AlertTriangle, 
  ExternalLink, ChevronRight, RefreshCw, X, ShieldCheck, FileCheck, ArrowUpRight, Anchor
} from 'lucide-react';
import { api } from '../services/api';
import OceanMap from './OceanMap';

export default function ShipmentTracker({ simulationDate = '2026-10-06', onSelectForInvoice, currentUser }) {
  const [shipments, setShipments] = useState([]);
  const [statusCounts, setStatusCounts] = useState({ all: 0, inTransit: 0, delivered: 0, delayed: 0 });
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedCarrier, setSelectedCarrier] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeShipment, setActiveShipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Add Shipment Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [newShipment, setNewShipment] = useState({
    carrier: 'OceanLink Lines',
    origin_port: 'Nhava Sheva',
    destination_port: 'Los Angeles',
    container_type: '20ft',
    departure_date: new Date().toISOString().split('T')[0],
    expected_arrival: new Date(Date.now() + 28 * 86400000).toISOString().split('T')[0],
    invoice_amount_usd: '',
    notes: ''
  });

  // Edit Status Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editShipment, setEditShipment] = useState(null);
  const [editStatus, setEditStatus] = useState('In Transit');
  const [editDeliveredDate, setEditDeliveredDate] = useState('');
  const [editReason, setEditReason] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  useEffect(() => {
    fetchShipments();
  }, [simulationDate]);

  const fetchShipments = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getShipments({ asOfDate: simulationDate });
      setShipments(data.shipments || []);
      setStatusCounts(data.statusCounts || { all: 0, inTransit: 0, delivered: 0, delayed: 0 });
      if (data.shipments?.length > 0 && !activeShipment) {
        setActiveShipment(data.shipments[0]);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch shipments');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateShipment = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError(null);
    try {
      await api.createShipment(newShipment);
      setIsAddModalOpen(false);
      setNewShipment({
        carrier: 'OceanLink Lines',
        origin_port: 'Nhava Sheva',
        destination_port: 'Los Angeles',
        container_type: '20ft',
        departure_date: new Date().toISOString().split('T')[0],
        expected_arrival: new Date(Date.now() + 28 * 86400000).toISOString().split('T')[0],
        invoice_amount_usd: '',
        notes: ''
      });
      fetchShipments();
    } catch (err) {
      setFormError(err.message || 'Failed to create shipment');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleQuickMarkDelivered = async (shipment) => {
    try {
      const todayStr = simulationDate || new Date().toISOString().split('T')[0];
      await api.updateShipment(shipment.shipment_id, {
        status: 'Delivered',
        delivered_date: todayStr,
        status_reason: 'Delivered successfully at port terminal'
      });
      fetchShipments();
    } catch (err) {
      alert('Error updating shipment: ' + err.message);
    }
  };

  const handleOpenEdit = (shp) => {
    setEditShipment(shp);
    setEditStatus(shp.status);
    setEditDeliveredDate(shp.delivered_date || simulationDate);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setEditSaving(true);
    try {
      await api.updateShipment(editShipment.shipment_id, {
        status: editStatus,
        delivered_date: editStatus === 'Delivered' ? editDeliveredDate : null,
        status_reason: editReason || `Status changed to ${editStatus}`
      });
      setIsEditModalOpen(false);
      fetchShipments();
    } catch (err) {
      alert('Error saving status: ' + err.message);
    } finally {
      setEditSaving(false);
    }
  };

  // Filtered shipments
  const filteredShipments = shipments.filter(s => {
    const matchesStatus = selectedStatus === 'All' || s.status.toLowerCase() === selectedStatus.toLowerCase() || (selectedStatus === 'Delayed' && s.isDelayed);
    const matchesCarrier = selectedCarrier === 'All' || s.carrier === selectedCarrier;
    const matchesSearch = !searchTerm || 
      s.shipment_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.carrier.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.origin_port.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.destination_port.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesCarrier && matchesSearch;
  });

  const getStatusBadge = (status, isDelayed) => {
    if (isDelayed || status === 'Delayed') {
      return (
        <span style={{
          background: 'rgba(244,63,94,0.15)', color: '#fb7185', border: '1px solid rgba(244,63,94,0.3)',
          padding: '3px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 700,
          display: 'inline-flex', alignItems: 'center', gap: '4px'
        }}>
          <AlertTriangle style={{ width: '12px', height: '12px' }} /> Delayed
        </span>
      );
    }
    if (status === 'Delivered') {
      return (
        <span style={{
          background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)',
          padding: '3px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 700,
          display: 'inline-flex', alignItems: 'center', gap: '4px'
        }}>
          <CheckCircle style={{ width: '12px', height: '12px' }} /> Delivered
        </span>
      );
    }
    return (
      <span style={{
        background: 'rgba(59,130,246,0.15)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.3)',
        padding: '3px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 700,
        display: 'inline-flex', alignItems: 'center', gap: '4px'
      }}>
        <Clock style={{ width: '12px', height: '12px' }} /> In Transit
      </span>
    );
  };

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
              <Ship style={{ width: '14px', height: '14px' }} /> Live Shipment Tracking & Port Geofencing
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#fff', margin: 0, fontFamily: 'Outfit, sans-serif' }}>
              Fleet Operations & Shipment Tracker
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '13px', marginTop: '4px' }}>
              Real-time vessel position monitoring, automatic SLA delay detection, and delivery validation.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button onClick={fetchShipments} className="btn-secondary" style={{ fontSize: '12px', padding: '8px 14px' }}>
              <RefreshCw style={{ width: '13px', height: '13px' }} /> Refresh
            </button>
            <button onClick={() => setIsAddModalOpen(true)} className="btn-primary" style={{ fontSize: '12px', padding: '8px 16px' }}>
              <Plus style={{ width: '14px', height: '14px' }} /> Add Shipment
            </button>
          </div>
        </div>

        {/* Status Filter Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginTop: '20px' }}>
          {[
            { id: 'All', label: 'Total Fleet', count: statusCounts.all, sub: 'All monitored shipments', color: '#94a3b8', activeColor: '#fff', activeBg: 'rgba(255,255,255,0.1)' },
            { id: 'In Transit', label: 'In Transit', count: statusCounts.inTransit, sub: 'Active ocean voyages', color: '#60a5fa', activeColor: '#60a5fa', activeBg: 'rgba(59,130,246,0.15)' },
            { id: 'Delivered', label: 'Delivered', count: statusCounts.delivered, sub: 'Discharged at destination', color: '#34d399', activeColor: '#34d399', activeBg: 'rgba(16,185,129,0.15)' },
            { id: 'Delayed', label: 'Delayed', count: statusCounts.delayed, sub: 'Exceeded expected ETA', color: '#fb7185', activeColor: '#fb7185', activeBg: 'rgba(244,63,94,0.15)' }
          ].map(f => {
            const isSelected = selectedStatus === f.id;
            return (
              <div
                key={f.id}
                onClick={() => setSelectedStatus(f.id)}
                style={{
                  background: isSelected ? f.activeBg : '#0d1527',
                  border: `1px solid ${isSelected ? f.color : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: '12px', padding: '14px 16px', cursor: 'pointer', transition: 'all 0.2s'
                }}
              >
                <div style={{ fontSize: '11px', fontWeight: 600, color: isSelected ? f.activeColor : '#94a3b8' }}>{f.label}</div>
                <div style={{ fontSize: '24px', fontWeight: 900, color: isSelected ? f.activeColor : '#fff', marginTop: '2px', fontFamily: 'Outfit, sans-serif' }}>
                  {f.count}
                </div>
                <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>{f.sub}</div>
              </div>
            );
          })}
        </div>

        {/* Search and Filters */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px', marginTop: '16px' }}>
          <div style={{ position: 'relative' }}>
            <Search style={{ position: 'absolute', left: '12px', top: '12px', width: '16px', height: '16px', color: '#64748b' }} />
            <input
              type="text"
              placeholder="Search by Shipment ID, origin, destination, carrier..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '38px', height: '40px', fontSize: '13px' }}
            />
          </div>
          <select
            value={selectedCarrier}
            onChange={e => setSelectedCarrier(e.target.value)}
            style={{ height: '40px', fontSize: '13px' }}
          >
            <option value="All">All Carriers</option>
            <option value="OceanLink Lines">OceanLink Lines</option>
            <option value="PacificStar Line">PacificStar Line</option>
            <option value="BlueWave Shipping">BlueWave Shipping</option>
            <option value="GlobalMariner">GlobalMariner</option>
            <option value="AtlasSea Carriers">AtlasSea Carriers</option>
          </select>
        </div>
      </div>

      {/* Main Grid: Left Shipments List, Right Interactive Map */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '20px', alignItems: 'start' }}>
        
        {/* Left: Shipments List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '0 4px' }}>
            Showing {filteredShipments.length} Shipments
          </div>

          {loading ? (
            <div style={{ ...cardStyle, padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
              <div style={{ width: '28px', height: '28px', border: '3px solid rgba(16,185,129,0.2)', borderTop: '3px solid #10b981', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 12px' }}></div>
              Loading live vessel telemetry...
            </div>
          ) : filteredShipments.length === 0 ? (
            <div style={{ ...cardStyle, padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
              No shipments found matching the selected filter.
            </div>
          ) : (
            filteredShipments.map(shp => {
              const isActive = activeShipment?.shipment_id === shp.shipment_id;
              const isDelayed = shp.isDelayed || shp.status === 'Delayed';
              return (
                <div
                  key={shp.shipment_id}
                  onClick={() => setActiveShipment(shp)}
                  style={{
                    ...cardStyle, padding: '18px 20px', cursor: 'pointer', transition: 'all 0.2s',
                    borderColor: isActive ? '#10b981' : isDelayed ? 'rgba(244,63,94,0.3)' : 'rgba(255,255,255,0.08)',
                    background: isActive ? 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(13,21,39,0.95) 100%)' : cardStyle.background
                  }}
                >
                  {/* Top Bar: ID, Carrier, Status Badge */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 800, color: '#fff', fontFamily: 'JetBrains Mono, monospace' }}>
                        {shp.shipment_id}
                      </span>
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>•</span>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#cbd5e1' }}>{shp.carrier}</span>
                      <span style={{ fontSize: '10px', background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: '4px', color: '#94a3b8', fontFamily: 'JetBrains Mono, monospace' }}>
                        {shp.container_type}
                      </span>
                    </div>
                    {getStatusBadge(shp.status, shp.isDelayed)}
                  </div>

                  {/* Route */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, color: '#e2e8f0', marginBottom: '12px' }}>
                    <Anchor style={{ width: '14px', height: '14px', color: '#34d399' }} />
                    <span>{shp.origin_port}</span>
                    <span style={{ color: '#64748b' }}>→</span>
                    <MapPin style={{ width: '14px', height: '14px', color: '#22d3ee' }} />
                    <span>{shp.destination_port}</span>
                  </div>

                  {/* Metadata Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', padding: '10px 12px', background: '#0a1020', borderRadius: '10px', fontSize: '11px', marginBottom: '12px' }}>
                    <div>
                      <span style={{ color: '#64748b', display: 'block' }}>Departure</span>
                      <strong style={{ color: '#cbd5e1', fontFamily: 'JetBrains Mono, monospace' }}>{shp.departure_date}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', display: 'block' }}>Expected Arrival</span>
                      <strong style={{ color: isDelayed ? '#fb7185' : '#cbd5e1', fontFamily: 'JetBrains Mono, monospace' }}>{shp.expected_arrival}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', display: 'block' }}>Billed Rate</span>
                      <strong style={{ color: '#34d399', fontFamily: 'JetBrains Mono, monospace' }}>${shp.invoice_amount_usd ? Number(shp.invoice_amount_usd).toLocaleString() : 'N/A'}</strong>
                    </div>
                  </div>

                  {/* Delay note if any */}
                  {isDelayed && (
                    <div style={{ fontSize: '11px', color: '#fb7185', background: 'rgba(244,63,94,0.08)', padding: '6px 10px', borderRadius: '6px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <AlertTriangle style={{ width: '12px', height: '12px', flexShrink: 0 }} />
                      <span>{shp.status_reason || 'Delayed past ETA'}</span>
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }} onClick={e => e.stopPropagation()}>
                    {shp.status !== 'Delivered' && (
                      <button onClick={() => handleQuickMarkDelivered(shp)} style={{
                        background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399',
                        fontSize: '11px', fontWeight: 600, padding: '5px 10px', borderRadius: '6px', cursor: 'pointer'
                      }}>
                        Mark Delivered
                      </button>
                    )}
                    <button onClick={() => handleOpenEdit(shp)} style={{
                      background: '#0d1527', border: '1px solid rgba(255,255,255,0.1)', color: '#cbd5e1',
                      fontSize: '11px', fontWeight: 600, padding: '5px 10px', borderRadius: '6px', cursor: 'pointer'
                    }}>
                      Update Status
                    </button>
                    {onSelectForInvoice && (
                      <button onClick={() => onSelectForInvoice({
                        shipment_id: shp.shipment_id,
                        carrier: shp.carrier,
                        origin_port: shp.origin_port,
                        destination_port: shp.destination_port,
                        container_type: shp.container_type,
                        invoice_amount_usd: shp.invoice_amount_usd
                      })} style={{
                        background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.3)', color: '#22d3ee',
                        fontSize: '11px', fontWeight: 600, padding: '5px 10px', borderRadius: '6px', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '4px'
                      }}>
                        <FileCheck style={{ width: '12px', height: '12px' }} /> Audit Invoice
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right: Map & Selected Shipment Detail */}
        <div style={{ position: 'sticky', top: '80px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Map */}
          <div style={{ ...cardStyle, padding: '16px', height: '420px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin style={{ width: '14px', height: '14px', color: '#10b981' }} /> Global Ocean Corridor View
              </div>
              {activeShipment && (
                <span style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'JetBrains Mono, monospace' }}>
                  Viewing {activeShipment.shipment_id}
                </span>
              )}
            </div>
            <div style={{ flex: 1, borderRadius: '10px', overflow: 'hidden', minHeight: '340px' }}>
              <OceanMap shipments={filteredShipments} activeShipment={activeShipment} onSelectShipment={setActiveShipment} />
            </div>
          </div>

          {/* Selected Shipment Summary Card */}
          {activeShipment && (
            <div style={{ ...cardStyle, padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Selected Vessel Telemetry</div>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', fontFamily: 'JetBrains Mono, monospace', margin: '2px 0 0' }}>
                    {activeShipment.shipment_id}
                  </h3>
                </div>
                {getStatusBadge(activeShipment.status, activeShipment.isDelayed)}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12px' }}>
                <div style={{ background: '#0a1020', padding: '10px', borderRadius: '8px' }}>
                  <span style={{ color: '#64748b', fontSize: '10px', display: 'block' }}>Carrier & Vessel</span>
                  <strong style={{ color: '#fff' }}>{activeShipment.carrier}</strong>
                </div>
                <div style={{ background: '#0a1020', padding: '10px', borderRadius: '8px' }}>
                  <span style={{ color: '#64748b', fontSize: '10px', display: 'block' }}>Container Specs</span>
                  <strong style={{ color: '#fff' }}>{activeShipment.container_type} standard</strong>
                </div>
                <div style={{ background: '#0a1020', padding: '10px', borderRadius: '8px' }}>
                  <span style={{ color: '#64748b', fontSize: '10px', display: 'block' }}>Origin → Destination</span>
                  <strong style={{ color: '#34d399' }}>{activeShipment.origin_port} → {activeShipment.destination_port}</strong>
                </div>
                <div style={{ background: '#0a1020', padding: '10px', borderRadius: '8px' }}>
                  <span style={{ color: '#64748b', fontSize: '10px', display: 'block' }}>Status Description</span>
                  <strong style={{ color: '#cbd5e1' }}>{activeShipment.status_reason || 'Normal voyage progression'}</strong>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Shipment Modal */}
      {isAddModalOpen && (
        <div className="modal-backdrop">
          <div style={{ ...cardStyle, maxWidth: '520px', width: '100%', padding: '24px', position: 'relative' }}>
            <button onClick={() => setIsAddModalOpen(false)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
              <X style={{ width: '18px', height: '18px' }} />
            </button>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', marginBottom: '6px' }}>Add New Ocean Shipment</h3>
            <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '18px' }}>Dispatch a container tracking order to monitor transit SLA and compare invoices.</p>

            {formError && <div style={{ padding: '10px', background: 'rgba(244,63,94,0.1)', color: '#fb7185', borderRadius: '8px', fontSize: '12px', marginBottom: '12px' }}>{formError}</div>}

            <form onSubmit={handleCreateShipment} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Carrier</label>
                  <select value={newShipment.carrier} onChange={e => setNewShipment({ ...newShipment, carrier: e.target.value })}>
                    <option value="OceanLink Lines">OceanLink Lines</option>
                    <option value="PacificStar Line">PacificStar Line</option>
                    <option value="BlueWave Shipping">BlueWave Shipping</option>
                    <option value="GlobalMariner">GlobalMariner</option>
                    <option value="AtlasSea Carriers">AtlasSea Carriers</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Container Size</label>
                  <select value={newShipment.container_type} onChange={e => setNewShipment({ ...newShipment, container_type: e.target.value })}>
                    <option value="20ft">20ft Container</option>
                    <option value="40ft">40ft Container</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Origin Port</label>
                  <select value={newShipment.origin_port} onChange={e => setNewShipment({ ...newShipment, origin_port: e.target.value })}>
                    <option value="Nhava Sheva">Nhava Sheva</option>
                    <option value="Mundra">Mundra</option>
                    <option value="Chennai">Chennai</option>
                    <option value="Kolkata">Kolkata</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Destination Port</label>
                  <select value={newShipment.destination_port} onChange={e => setNewShipment({ ...newShipment, destination_port: e.target.value })}>
                    <option value="Los Angeles">Los Angeles</option>
                    <option value="New York">New York</option>
                    <option value="Savannah">Savannah</option>
                    <option value="Houston">Houston</option>
                    <option value="Long Beach">Long Beach</option>
                    <option value="Norfolk">Norfolk</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Departure Date</label>
                  <input type="date" value={newShipment.departure_date} onChange={e => setNewShipment({ ...newShipment, departure_date: e.target.value })} required />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Expected ETA</label>
                  <input type="date" value={newShipment.expected_arrival} onChange={e => setNewShipment({ ...newShipment, expected_arrival: e.target.value })} required />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Billed Amount (USD)</label>
                <input type="number" placeholder="e.g. 2600" value={newShipment.invoice_amount_usd} onChange={e => setNewShipment({ ...newShipment, invoice_amount_usd: e.target.value })} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="btn-secondary" style={{ fontSize: '12px' }}>Cancel</button>
                <button type="submit" disabled={formSubmitting} className="btn-primary" style={{ fontSize: '12px' }}>
                  {formSubmitting ? 'Creating...' : 'Create Shipment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Status Modal */}
      {isEditModalOpen && editShipment && (
        <div className="modal-backdrop">
          <div style={{ ...cardStyle, maxWidth: '440px', width: '100%', padding: '24px', position: 'relative' }}>
            <button onClick={() => setIsEditModalOpen(false)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
              <X style={{ width: '18px', height: '18px' }} />
            </button>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', marginBottom: '6px' }}>Update Status: {editShipment.shipment_id}</h3>
            <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '18px' }}>Modify the voyage delivery status or record port discharge.</p>

            <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Status</label>
                <select value={editStatus} onChange={e => setEditStatus(e.target.value)}>
                  <option value="In Transit">In Transit</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Delayed">Delayed</option>
                </select>
              </div>

              {editStatus === 'Delivered' && (
                <div>
                  <label style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Delivered Date</label>
                  <input type="date" value={editDeliveredDate} onChange={e => setEditDeliveredDate(e.target.value)} required />
                </div>
              )}

              <div>
                <label style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Status Reason / Note</label>
                <input type="text" placeholder="e.g. Port congestion delay, or Discharged successfully" value={editReason} onChange={e => setEditReason(e.target.value)} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="btn-secondary" style={{ fontSize: '12px' }}>Cancel</button>
                <button type="submit" disabled={editSaving} className="btn-primary" style={{ fontSize: '12px' }}>
                  {editSaving ? 'Saving...' : 'Save Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 900px) {
          .main-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
