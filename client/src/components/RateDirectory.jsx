import React, { useState, useEffect } from 'react';
import { 
  Table, Search, Plus, Filter, Edit, Trash2, Check, X, 
  ArrowUpDown, Download, Ship, DollarSign, Clock, Leaf
} from 'lucide-react';
import { api } from '../services/api';

export default function RateDirectory({ currentUser, currency = 'USD' }) {
  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [carrierFilter, setCarrierFilter] = useState('All');
  const [containerFilter, setContainerFilter] = useState('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    carrier: 'OceanLink Lines',
    origin_port: 'Nhava Sheva',
    destination_port: 'Los Angeles',
    container_type: '20ft',
    rate_usd: '',
    transit_days: '28'
  });

  useEffect(() => {
    fetchRates();
  }, [carrierFilter, containerFilter]);

  const fetchRates = async () => {
    setLoading(true);
    try {
      const params = {
        ...(carrierFilter !== 'All' ? { carrier: carrierFilter } : {}),
        ...(containerFilter !== 'All' ? { containerType: containerFilter } : {}),
        ...(searchTerm ? { search: searchTerm } : {})
      };
      const data = await api.getAllRates(params);
      setRates(data.rates || []);
    } catch (err) {
      console.error('Failed to load rates:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchRates();
  };

  const handleCreateRate = async (e) => {
    e.preventDefault();
    try {
      await api.createRate(formData);
      setIsAddModalOpen(false);
      setFormData({
        carrier: 'OceanLink Lines',
        origin_port: 'Nhava Sheva',
        destination_port: 'Los Angeles',
        container_type: '20ft',
        rate_usd: '',
        transit_days: '28'
      });
      fetchRates();
    } catch (err) {
      alert('Error creating rate: ' + err.message);
    }
  };

  const handleDeleteRate = async (id) => {
    if (!window.confirm('Are you sure you want to delete this carrier rate?')) return;
    try {
      await api.deleteRate(id);
      fetchRates();
    } catch (err) {
      alert('Error deleting rate: ' + err.message);
    }
  };

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
              <Table style={{ width: '14px', height: '14px' }} /> Master Contracted Tariff Directory
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#fff', margin: 0, fontFamily: 'Outfit, sans-serif' }}>
              Carrier Rate Matrix & Tariffs
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '13px', marginTop: '4px' }}>
              Complete master rates database across all global ocean shipping lines, container types, and corridors.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button onClick={() => setIsAddModalOpen(true)} className="btn-primary" style={{ fontSize: '12px', padding: '8px 16px' }}>
              <Plus style={{ width: '14px', height: '14px' }} /> Add Tariff Rate
            </button>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '12px', marginTop: '20px' }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search style={{ position: 'absolute', left: '12px', top: '12px', width: '16px', height: '16px', color: '#64748b' }} />
              <input
                type="text"
                placeholder="Search carrier or port..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '38px', height: '40px', fontSize: '13px' }}
              />
            </div>
            <button type="submit" className="btn-secondary" style={{ fontSize: '12px', padding: '0 16px' }}>Search</button>
          </form>

          <select value={carrierFilter} onChange={e => setCarrierFilter(e.target.value)} style={{ height: '40px', fontSize: '13px' }}>
            <option value="All">All Carriers</option>
            <option value="OceanLink Lines">OceanLink Lines</option>
            <option value="PacificStar Line">PacificStar Line</option>
            <option value="BlueWave Shipping">BlueWave Shipping</option>
            <option value="GlobalMariner">GlobalMariner</option>
            <option value="AtlasSea Carriers">AtlasSea Carriers</option>
          </select>

          <select value={containerFilter} onChange={e => setContainerFilter(e.target.value)} style={{ height: '40px', fontSize: '13px' }}>
            <option value="All">All Containers</option>
            <option value="20ft">20ft Container</option>
            <option value="40ft">40ft Container</option>
          </select>

          <button onClick={() => { setSearchTerm(''); setCarrierFilter('All'); setContainerFilter('All'); }} className="btn-secondary" style={{ fontSize: '12px', padding: '0 12px' }}>
            Reset
          </button>
        </div>
      </div>

      {/* Rates Table Card */}
      <div style={{ ...cardStyle, padding: '20px', overflowX: 'auto' }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff', marginBottom: '14px' }}>
          Total Contracted Rates: {rates.length}
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
            <div style={{ width: '28px', height: '28px', border: '3px solid rgba(16,185,129,0.2)', borderTop: '3px solid #10b981', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 12px' }}></div>
            Loading tariffs...
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Carrier</th>
                <th>Origin Port</th>
                <th>Destination Port</th>
                <th>Container</th>
                <th>Contract Rate</th>
                <th>Transit Days</th>
                <th>Last Updated</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rates.map(r => (
                <tr key={r.id}>
                  <td>
                    <strong style={{ color: '#fff' }}>{r.carrier}</strong>
                  </td>
                  <td>{r.origin_port}</td>
                  <td>{r.destination_port}</td>
                  <td>
                    <span style={{ fontSize: '11px', background: '#0a1020', padding: '2px 8px', borderRadius: '4px', color: '#94a3b8', fontFamily: 'JetBrains Mono, monospace' }}>
                      {r.container_type}
                    </span>
                  </td>
                  <td>
                    <strong style={{ color: '#34d399', fontFamily: 'JetBrains Mono, monospace', fontSize: '14px' }}>
                      {formatPrice(r.rate_usd)}
                    </strong>
                  </td>
                  <td style={{ fontFamily: 'JetBrains Mono, monospace' }}>{r.transit_days} days</td>
                  <td style={{ fontSize: '11px', color: '#64748b' }}>{r.updated_at || r.created_at || 'Standard'}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button onClick={() => handleDeleteRate(r.id)} style={{ background: 'none', border: 'none', color: '#fb7185', cursor: 'pointer', padding: '4px' }} title="Delete Rate">
                      <Trash2 style={{ width: '15px', height: '15px' }} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Rate Modal */}
      {isAddModalOpen && (
        <div className="modal-backdrop">
          <div style={{ ...cardStyle, maxWidth: '480px', width: '100%', padding: '24px', position: 'relative' }}>
            <button onClick={() => setIsAddModalOpen(false)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
              <X style={{ width: '18px', height: '18px' }} />
            </button>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', marginBottom: '6px' }}>Add New Master Rate</h3>
            <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '18px' }}>Create a contracted tariff rate for freight invoice comparisons.</p>

            <form onSubmit={handleCreateRate} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Carrier</label>
                <select value={formData.carrier} onChange={e => setFormData({ ...formData, carrier: e.target.value })}>
                  <option value="OceanLink Lines">OceanLink Lines</option>
                  <option value="PacificStar Line">PacificStar Line</option>
                  <option value="BlueWave Shipping">BlueWave Shipping</option>
                  <option value="GlobalMariner">GlobalMariner</option>
                  <option value="AtlasSea Carriers">AtlasSea Carriers</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Origin Port</label>
                  <select value={formData.origin_port} onChange={e => setFormData({ ...formData, origin_port: e.target.value })}>
                    <option value="Nhava Sheva">Nhava Sheva</option>
                    <option value="Mundra">Mundra</option>
                    <option value="Chennai">Chennai</option>
                    <option value="Kolkata">Kolkata</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Destination Port</label>
                  <select value={formData.destination_port} onChange={e => setFormData({ ...formData, destination_port: e.target.value })}>
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
                  <label style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Container Type</label>
                  <select value={formData.container_type} onChange={e => setFormData({ ...formData, container_type: e.target.value })}>
                    <option value="20ft">20ft Container</option>
                    <option value="40ft">40ft Container</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Transit Days</label>
                  <input type="number" value={formData.transit_days} onChange={e => setFormData({ ...formData, transit_days: e.target.value })} required />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Rate (USD $)</label>
                <input type="number" placeholder="e.g. 2450" value={formData.rate_usd} onChange={e => setFormData({ ...formData, rate_usd: e.target.value })} required />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="btn-secondary" style={{ fontSize: '12px' }}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ fontSize: '12px' }}>Save Rate</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
