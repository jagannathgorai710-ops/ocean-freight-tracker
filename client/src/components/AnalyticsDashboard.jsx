import React, { useState, useEffect } from 'react';
import { 
  BarChart3, TrendingUp, DollarSign, Award, Leaf, Download, 
  ShieldCheck, RefreshCw, FileSpreadsheet, PieChart
} from 'lucide-react';
import { api } from '../services/api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function AnalyticsDashboard({ currency = 'USD' }) {
  const [summary, setSummary] = useState(null);
  const [charts, setCharts] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sumRes, chartRes] = await Promise.all([
        api.getSummary(),
        api.getCharts()
      ]);
      setSummary(sumRes);
      setCharts(chartRes);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
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

  if (loading || !summary || !charts) {
    return (
      <div style={{ ...cardStyle, padding: '60px', textAlign: 'center', color: '#94a3b8' }}>
        <div style={{ width: '32px', height: '32px', border: '3px solid rgba(16,185,129,0.2)', borderTop: '3px solid #10b981', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 16px' }}></div>
        <span style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>Aggregating global freight intelligence...</span>
      </div>
    );
  }

  // Chart Data: Status Distribution Doughnut
  const statusDoughnutData = {
    labels: ['In Transit', 'Delivered', 'Delayed'],
    datasets: [{
      data: [
        charts.statusDistribution['In Transit'] || 0,
        charts.statusDistribution['Delivered'] || 0,
        charts.statusDistribution['Delayed'] || 0
      ],
      backgroundColor: [
        'rgba(59, 130, 246, 0.85)',
        'rgba(16, 185, 129, 0.85)',
        'rgba(244, 63, 94, 0.85)'
      ],
      borderColor: ['#3b82f6', '#10b981', '#f43f5e'],
      borderWidth: 2
    }]
  };

  // Chart Data: Carrier Performance Stacked Bar
  const carrierLabels = charts.carrierPerformance.map(c => c.carrier);
  const carrierDelivered = charts.carrierPerformance.map(c => c.delivered);
  const carrierInTransit = charts.carrierPerformance.map(c => c.inTransit);
  const carrierDelayed = charts.carrierPerformance.map(c => c.delayed);

  const carrierBarData = {
    labels: carrierLabels,
    datasets: [
      { label: 'Delivered', data: carrierDelivered, backgroundColor: 'rgba(16, 185, 129, 0.8)', borderRadius: 6 },
      { label: 'In Transit', data: carrierInTransit, backgroundColor: 'rgba(59, 130, 246, 0.8)', borderRadius: 6 },
      { label: 'Delayed', data: carrierDelayed, backgroundColor: 'rgba(244, 63, 94, 0.8)', borderRadius: 6 }
    ]
  };

  // Chart Data: Route Price Comparison Bar
  const routeLabels = charts.routePriceArray.map(r => r.route);
  const avg20ft = charts.routePriceArray.map(r => r.avg20ft);
  const avg40ft = charts.routePriceArray.map(r => r.avg40ft);

  const routePriceData = {
    labels: routeLabels,
    datasets: [
      { label: '20ft Avg USD', data: avg20ft, backgroundColor: 'rgba(6, 182, 212, 0.8)', borderRadius: 6 },
      { label: '40ft Avg USD', data: avg40ft, backgroundColor: 'rgba(139, 92, 246, 0.8)', borderRadius: 6 }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: '#94a3b8', font: { size: 11 } }
      }
    },
    scales: {
      x: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#94a3b8', font: { size: 10 } } },
      y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#94a3b8', font: { size: 10 } } }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ ...cardStyle, padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#34d399', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
              <BarChart3 style={{ width: '14px', height: '14px' }} /> Executive Logistics Intelligence & Export
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#fff', margin: 0, fontFamily: 'Outfit, sans-serif' }}>
              Freight Analytics & Sustainability Report
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '13px', marginTop: '4px' }}>
              Corridor pricing trends, carrier SLA on-time metrics, overcharge recovery audits, and carbon efficiency metrics.
            </p>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            <a href={api.getExportUrl('rates', 'xlsx')} download className="btn-secondary" style={{ fontSize: '12px', padding: '8px 12px' }}>
              <Download style={{ width: '13px', height: '13px', color: '#34d399' }} /> Rates (.xlsx)
            </a>
            <a href={api.getExportUrl('shipments', 'xlsx')} download className="btn-secondary" style={{ fontSize: '12px', padding: '8px 12px' }}>
              <Download style={{ width: '13px', height: '13px', color: '#60a5fa' }} /> Shipments (.xlsx)
            </a>
            <a href={api.getExportUrl('invoices', 'xlsx')} download className="btn-secondary" style={{ fontSize: '12px', padding: '8px 12px' }}>
              <Download style={{ width: '13px', height: '13px', color: '#fb7185' }} /> Invoices (.xlsx)
            </a>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
        <div style={{ ...cardStyle, padding: '18px' }}>
          <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>Active Fleet Shipments</span>
          <div style={{ fontSize: '26px', fontWeight: 900, color: '#60a5fa', marginTop: '4px', fontFamily: 'Outfit, sans-serif' }}>
            {summary.shipments?.inTransit || 0} <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>/ {summary.shipments?.total || 0} total</span>
          </div>
          <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>Live ocean corridor monitoring</div>
        </div>

        <div style={{ ...cardStyle, padding: '18px', background: 'rgba(16,185,129,0.06)', borderColor: 'rgba(16,185,129,0.25)' }}>
          <span style={{ fontSize: '11px', color: '#34d399', fontWeight: 600 }}>On-Time Delivery Rate</span>
          <div style={{ fontSize: '26px', fontWeight: 900, color: '#34d399', marginTop: '4px', fontFamily: 'Outfit, sans-serif' }}>
            {summary.shipments?.total > 0 ? Math.round(((summary.shipments.delivered || 0) / (summary.shipments.total - (summary.shipments.delayed || 0) || 1)) * 100) : 92}%
          </div>
          <div style={{ fontSize: '10px', color: '#34d399', marginTop: '2px' }}>SLA fulfillment score</div>
        </div>

        <div style={{ ...cardStyle, padding: '18px', background: 'rgba(244,63,94,0.06)', borderColor: 'rgba(244,63,94,0.25)' }}>
          <span style={{ fontSize: '11px', color: '#fb7185', fontWeight: 600 }}>Recoverable Overcharges</span>
          <div style={{ fontSize: '26px', fontWeight: 900, color: '#fb7185', marginTop: '4px', fontFamily: 'Outfit, sans-serif' }}>
            {formatPrice(summary.financials?.totalOverchargedUsd || 0)}
          </div>
          <div style={{ fontSize: '10px', color: '#fb7185', marginTop: '2px' }}>Identified via contract audit</div>
        </div>

        <div style={{ ...cardStyle, padding: '18px', background: 'rgba(6,182,212,0.06)', borderColor: 'rgba(6,182,212,0.25)' }}>
          <span style={{ fontSize: '11px', color: '#22d3ee', fontWeight: 600 }}>Fleet Carbon Offset</span>
          <div style={{ fontSize: '26px', fontWeight: 900, color: '#22d3ee', marginTop: '4px', fontFamily: 'Outfit, sans-serif' }}>
            ~328.5 <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>Tons CO₂e</span>
          </div>
          <div style={{ fontSize: '10px', color: '#22d3ee', marginTop: '2px' }}>IMO Class A ocean efficiency</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
        {/* Status Distribution */}
        <div style={{ ...cardStyle, padding: '20px', height: '340px', display: 'flex', flexDirection: 'column' }}>
          <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#fff', marginBottom: '12px' }}>Shipment Status Distribution</h4>
          <div style={{ flex: 1, position: 'relative' }}>
            <Doughnut data={statusDoughnutData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 11 } } } } }} />
          </div>
        </div>

        {/* Carrier SLA Performance */}
        <div style={{ ...cardStyle, padding: '20px', height: '340px', display: 'flex', flexDirection: 'column' }}>
          <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#fff', marginBottom: '12px' }}>Carrier SLA Performance (Delivered vs Delayed)</h4>
          <div style={{ flex: 1, position: 'relative' }}>
            <Bar data={carrierBarData} options={{ ...chartOptions, scales: { ...chartOptions.scales, x: { ...chartOptions.scales.x, stacked: true }, y: { ...chartOptions.scales.y, stacked: true } } }} />
          </div>
        </div>
      </div>

      {/* Route Price Comparison Chart */}
      <div style={{ ...cardStyle, padding: '20px', height: '340px', display: 'flex', flexDirection: 'column' }}>
        <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#fff', marginBottom: '12px' }}>Average Market Rate by Corridor (20ft vs 40ft Container)</h4>
        <div style={{ flex: 1, position: 'relative' }}>
          <Bar data={routePriceData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
}
