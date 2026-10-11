import React, { useState, useEffect } from 'react';
import { Search, Ship, Clock, Leaf, DollarSign, ArrowRight, Sparkles, TrendingDown, SlidersHorizontal, Anchor, AlertCircle, RefreshCw, Compass } from 'lucide-react';
import { api } from '../services/api';

// Map of all contracted corridors in the problem dataset
const PORT_ROUTES = {
  'Nhava Sheva': ['Los Angeles', 'New York', 'Savannah', 'Houston'],
  'Mundra': ['Los Angeles', 'New York'],
  'Chennai': ['Long Beach', 'Savannah'],
  'Kolkata': ['Houston', 'Norfolk']
};

export default function RateSearch({ currency = 'USD', onSelectForInvoice }) {
  const [origins, setOrigins] = useState(Object.keys(PORT_ROUTES));
  const [selectedOrigin, setSelectedOrigin] = useState('Nhava Sheva');
  const [destinations, setDestinations] = useState(PORT_ROUTES['Nhava Sheva']);
  const [selectedDest, setSelectedDest] = useState('Los Angeles');
  const [containerType, setContainerType] = useState('20ft');
  const [sortBy, setSortBy] = useState('price');
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    executeSearch('Nhava Sheva', 'Los Angeles', '20ft', 'price');
  }, []);

  const executeSearch = async (orig = selectedOrigin, dest = selectedDest, type = containerType, sort = sortBy) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.searchRates(orig, dest, type, sort);
      setSearchResults(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch rates.');
    } finally {
      setLoading(false);
    }
  };

  const handleOriginChange = (orig) => {
    setSelectedOrigin(orig);
    const validDests = PORT_ROUTES[orig] || ['Los Angeles', 'New York', 'Houston', 'Savannah', 'Long Beach', 'Norfolk'];
    setDestinations(validDests);
    const newDest = validDests.includes(selectedDest) ? selectedDest : validDests[0];
    setSelectedDest(newDest);
    executeSearch(orig, newDest, containerType, sortBy);
  };

  const handleDestChange = (dest) => {
    setSelectedDest(dest);
    executeSearch(selectedOrigin, dest, containerType, sortBy);
  };

  const handleTypeChange = (type) => {
    setContainerType(type);
    executeSearch(selectedOrigin, selectedDest, type, sortBy);
  };

  const handleSortChange = (sort) => {
    setSortBy(sort);
    executeSearch(selectedOrigin, selectedDest, containerType, sort);
  };

  const handleQuickRoute = (orig, dest, type = '20ft') => {
    setSelectedOrigin(orig);
    const validDests = PORT_ROUTES[orig] || [dest];
    setDestinations(validDests);
    setSelectedDest(dest);
    setContainerType(type);
    executeSearch(orig, dest, type, sortBy);
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
      {/* Header & Search Form */}
      <div style={{ ...cardStyle, padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#34d399', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
              <Sparkles style={{ width: '14px', height: '14px' }} /> Module 1: Ocean Freight Rate Intelligence
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#fff', fontFamily: 'Outfit, sans-serif', margin: 0 }}>
              Rate Search & Carrier Comparison Engine
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '13px', marginTop: '4px' }}>
              Find and compare contracted ocean rates across carriers, corridors, and container specifications with CO₂ metrics.
            </p>
          </div>

          {/* Quick Route Shortcuts */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', color: '#64748b', fontFamily: 'JetBrains Mono, monospace' }}>Quick Corridors:</span>
            {[
              { orig: 'Nhava Sheva', dest: 'Los Angeles' },
              { orig: 'Mundra', dest: 'New York' },
              { orig: 'Chennai', dest: 'Long Beach' },
              { orig: 'Kolkata', dest: 'Norfolk' }
            ].map(r => (
              <button
                key={`${r.orig}-${r.dest}`}
                onClick={() => handleQuickRoute(r.orig, r.dest)}
                style={{
                  padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, border: '1px solid rgba(255,255,255,0.1)',
                  background: (selectedOrigin === r.orig && selectedDest === r.dest) ? 'rgba(16,185,129,0.18)' : '#0a1020',
                  color: (selectedOrigin === r.orig && selectedDest === r.dest) ? '#34d399' : '#cbd5e1',
                  cursor: 'pointer'
                }}
              >
                {r.orig} → {r.dest}
              </button>
            ))}
          </div>
        </div>

        {/* Search Form Controls */}
        <form onSubmit={(e) => { e.preventDefault(); executeSearch(); }} style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 1fr 1fr auto', gap: '12px', alignItems: 'end' }}>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
              <Anchor style={{ width: '13px', height: '13px', color: '#34d399' }} /> Origin Port
            </label>
            <select value={selectedOrigin} onChange={e => handleOriginChange(e.target.value)} style={{ height: '42px', fontSize: '13px' }}>
              {origins.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
              <Ship style={{ width: '13px', height: '13px', color: '#22d3ee' }} /> Destination Port
            </label>
            <select value={selectedDest} onChange={e => handleDestChange(e.target.value)} style={{ height: '42px', fontSize: '13px' }}>
              {destinations.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '11px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px', display: 'block' }}>Container Size</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              {['20ft', '40ft'].map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => handleTypeChange(t)}
                  style={{
                    height: '42px', fontSize: '12px', fontWeight: 700, borderRadius: '8px', cursor: 'pointer', border: '1px solid',
                    background: containerType === t ? 'rgba(16,185,129,0.18)' : '#0a1020',
                    color: containerType === t ? '#34d399' : '#94a3b8',
                    borderColor: containerType === t ? '#10b981' : 'rgba(255,255,255,0.1)'
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
              <SlidersHorizontal style={{ width: '13px', height: '13px' }} /> Sort Order
            </label>
            <select value={sortBy} onChange={e => handleSortChange(e.target.value)} style={{ height: '42px', fontSize: '13px' }}>
              <option value="price">Price: Low to High</option>
              <option value="transit_days">Transit: Fastest First</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>

          <button type="submit" disabled={loading} className="btn-primary" style={{ height: '42px', fontSize: '13px', padding: '0 20px' }}>
            {loading ? (
              <div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }}></div>
            ) : (
              <><Search style={{ width: '15px', height: '15px' }} /> Search</>
            )}
          </button>
        </form>
      </div>

      {error && (
        <div style={{ padding: '14px 18px', background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)', borderRadius: '12px', color: '#fb7185', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AlertCircle style={{ width: '18px', height: '18px' }} />
          <span>{error}</span>
        </div>
      )}

      {/* Results View */}
      {searchResults && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {searchResults.results && searchResults.results.length > 0 ? (
            <>
              {/* Summary KPIs */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                <div style={{ ...cardStyle, padding: '16px', background: 'rgba(16,185,129,0.08)', borderColor: 'rgba(16,185,129,0.3)' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#34d399' }}>Lowest Contracted Rate</div>
                  <div style={{ fontSize: '26px', fontWeight: 900, color: '#34d399', marginTop: '2px', fontFamily: 'Outfit, sans-serif' }}>
                    {formatPrice(searchResults.cheapestRateUsd)}
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Carrier: {searchResults.cheapestCarrier}</div>
                </div>

                <div style={{ ...cardStyle, padding: '16px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8' }}>Corridor Average</div>
                  <div style={{ fontSize: '26px', fontWeight: 900, color: '#fff', marginTop: '2px', fontFamily: 'Outfit, sans-serif' }}>
                    {formatPrice(searchResults.averageRateUsd)}
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>across all {searchResults.results.length} carriers</div>
                </div>

                <div style={{ ...cardStyle, padding: '16px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8' }}>Maximum Tariff</div>
                  <div style={{ fontSize: '26px', fontWeight: 900, color: '#94a3b8', marginTop: '2px', fontFamily: 'Outfit, sans-serif' }}>
                    {formatPrice(searchResults.maxRateUsd)}
                  </div>
                  <div style={{ fontSize: '11px', color: '#34d399', marginTop: '2px' }}>
                    Spread: Save up to {formatPrice(searchResults.maxRateUsd - searchResults.cheapestRateUsd)}
                  </div>
                </div>

                <div style={{ ...cardStyle, padding: '16px', background: 'rgba(6,182,212,0.08)', borderColor: 'rgba(6,182,212,0.3)' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#22d3ee' }}>Corridor Green Rating</div>
                  <div style={{ fontSize: '26px', fontWeight: 900, color: '#22d3ee', marginTop: '2px', fontFamily: 'Outfit, sans-serif' }}>
                    {searchResults.results[0]?.sustainability?.ecoRating?.split(' ')[0] || 'A+'}
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                    ~{searchResults.results[0]?.sustainability?.estimatedCO2Kg} kg CO₂ / TEU
                  </div>
                </div>
              </div>

              {/* Carriers Count Header */}
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '0 4px' }}>
                Comparing {searchResults.results.length} carriers for {selectedOrigin} → {selectedDest} ({containerType})
              </div>

              {/* Carrier Cards */}
              {searchResults.results.map((rate, idx) => {
                const isFirst = rate.isCheapest;
                return (
                  <div
                    key={rate.id || idx}
                    style={{
                      ...cardStyle, padding: '22px 24px', position: 'relative', overflow: 'hidden',
                      borderColor: isFirst ? 'rgba(16,185,129,0.5)' : 'rgba(255,255,255,0.08)',
                      background: isFirst ? 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(13,21,39,0.95) 40%)' : cardStyle.background
                    }}
                  >
                    {isFirst && (
                      <div style={{
                        position: 'absolute', top: 0, right: 0,
                        background: 'linear-gradient(135deg, #10b981, #047857)', color: '#fff',
                        padding: '4px 14px', borderRadius: '0 16px 0 10px',
                        fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em',
                        display: 'flex', alignItems: 'center', gap: '4px'
                      }}>
                        <Sparkles style={{ width: '12px', height: '12px' }} /> CHEAPEST CARRIER
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                      {/* Left: Carrier details */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{
                          width: '44px', height: '44px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '16px', fontWeight: 800,
                          background: isFirst ? 'rgba(16,185,129,0.15)' : '#0a1020',
                          color: isFirst ? '#34d399' : '#94a3b8',
                          border: `1px solid ${isFirst ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.08)'}`
                        }}>
                          #{idx + 1}
                        </div>
                        <div>
                          <h4 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', margin: 0, fontFamily: 'Outfit, sans-serif' }}>
                            {rate.carrier}
                          </h4>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', marginTop: '6px', fontSize: '12px', color: '#94a3b8' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#cbd5e1' }}>
                              <Clock style={{ width: '13px', height: '13px', color: '#22d3ee' }} />
                              <strong>{rate.transit_days} Days</strong> transit
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#34d399' }}>
                              <Leaf style={{ width: '13px', height: '13px' }} />
                              {rate.sustainability?.ecoRating}
                            </span>
                            <span>CO₂: <strong style={{ color: '#cbd5e1' }}>{rate.sustainability?.estimatedCO2Kg} kg</strong></span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Rate and action */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '11px', color: '#94a3b8' }}>Contract Tariff</div>
                          <div style={{ fontSize: '26px', fontWeight: 900, color: isFirst ? '#34d399' : '#fff', fontFamily: 'JetBrains Mono, monospace' }}>
                            {formatPrice(rate.rate_usd)}
                          </div>
                          {rate.savingsVsMax > 0 && (
                            <div style={{ fontSize: '11px', color: '#34d399', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                              <TrendingDown style={{ width: '12px', height: '12px' }} /> Save {formatPrice(rate.savingsVsMax)}
                            </div>
                          )}
                        </div>

                        {onSelectForInvoice && (
                          <button
                            onClick={() => onSelectForInvoice(rate)}
                            className={isFirst ? 'btn-primary' : 'btn-secondary'}
                            style={{ fontSize: '12px', padding: '8px 14px' }}
                          >
                            Audit <ArrowRight style={{ width: '13px', height: '13px' }} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Progress index bar */}
                    <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '10px', color: '#64748b', fontFamily: 'JetBrains Mono, monospace' }}>Tariff Index:</span>
                      <div style={{ flex: 1, height: '6px', background: '#0a1020', borderRadius: '999px', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', borderRadius: '999px',
                          width: `${Math.max(Math.round((rate.rate_usd / searchResults.maxRateUsd) * 100), 20)}%`,
                          background: isFirst ? 'linear-gradient(90deg, #10b981, #34d399)' : '#475569'
                        }}></div>
                      </div>
                      <span style={{ fontSize: '10px', color: '#64748b', fontFamily: 'JetBrains Mono, monospace' }}>
                        {Math.round((rate.rate_usd / searchResults.maxRateUsd) * 100)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </>
          ) : (
            <div style={{ ...cardStyle, padding: '36px', textAlign: 'center', color: '#94a3b8' }}>
              <Compass style={{ width: '36px', height: '36px', color: '#10b981', margin: '0 auto 12px' }} />
              <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#fff' }}>No Direct Tariff on File for {selectedOrigin} → {selectedDest}</h4>
              <p style={{ fontSize: '13px', marginTop: '6px', maxWidth: '480px', margin: '6px auto 0', color: '#94a3b8' }}>
                In the problem dataset, <strong>{selectedOrigin}</strong> has contracted tariffs to:
              </p>

              {/* Suggestions for this origin */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '14px', flexWrap: 'wrap' }}>
                {(PORT_ROUTES[selectedOrigin] || []).map(dest => (
                  <button
                    key={dest}
                    onClick={() => handleQuickRoute(selectedOrigin, dest, containerType)}
                    className="btn-primary"
                    style={{ fontSize: '12px', padding: '6px 14px' }}
                  >
                    View {selectedOrigin} → {dest}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
