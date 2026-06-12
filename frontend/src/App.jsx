import React, { useState, useEffect, useRef } from 'react';
import { Analytics } from '@vercel/analytics/react';

// Geographical Coordinate Index for Indian Engineering Institutions
const COLLEGE_COORDINATES = {
  'bombay': [19.1334, 72.9133], 'delhi': [28.5450, 77.1926], 'madras': [13.0067, 80.2376],
  'kanpur': [26.5123, 80.2329], 'kharagpur': [22.3149, 87.3105], 'roorkee': [29.8649, 77.8965],
  'hyderabad': [17.4171, 78.1350], 'guwahati': [26.1859, 91.6925], 'mandi': [31.7754, 76.9858],
  'hamirpur': [31.7081, 76.5273], 'rourkela': [22.2531, 84.9011], 'surathkal': [13.0108, 74.7943],
  'patna': [25.6208, 85.1725], 'una': [31.4790, 76.2731], 'trichy': [10.7589, 78.8132],
  'tiruchirappalli': [10.7589, 78.8132], 'warangal': [17.9768, 79.5311], 'calicut': [11.3216, 75.9336],
  'jaipur': [26.8629, 75.8105], 'allahabad': [25.4920, 81.8659], 'kurukshetra': [29.9639, 76.8143],
  'surat': [21.1643, 72.7846], 'nagpur': [21.1245, 79.0518], 'jamshedpur': [22.7768, 86.1437],
  'bhopal': [23.2163, 77.4074], 'indore': [22.5204, 75.9207], 'bhubaneswar': [20.1481, 85.6712],
  'jodhpur': [26.2238, 73.1141], 'gandhinagar': [23.2120, 72.6841], 'ropar': [30.9675, 76.4731],
  'silchar': [24.7551, 92.7923], 'agartala': [23.8427, 91.4239], 'srinagar': [34.1259, 74.8377],
  'jalandhar': [31.3960, 75.5358], 'goa': [15.4231, 73.9781], 'raipur': [21.2497, 81.6050],
  'arunachal': [27.1004, 93.4727]
};

function App() {
  const urlParams = new URLSearchParams(window.location.search);
  const isMapViewTab = urlParams.get('view') === 'map';

  // React Hooks Lifecycle compliance (Moved out of conditional blocks)
  const mapContainerRef = useRef(null);
  const mapObjectRef = useRef(null);
  const [mapData, setMapData] = useState([]);

  const [formData, setFormData] = useState({
    rank: '', advancedRank: '', category: 'OPEN', gender: 'Gender-Neutral', quota: 'AI', institute: '', branch: ''
  });

  const [results, setResults] = useState([]);
  const [totalOptions, setTotalOptions] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const [activeMasterTab, setActiveMasterTab] = useState('Other');
  const [activeSubTab, setActiveSubTab] = useState('Safe');
  const [visibleCount, setVisibleCount] = useState(20);

  // ------------------------------------------------------------------------
  // SUB-COMPONENT ROUTE A: IMMERSIVE MULTI-COLOR MAP VIEWPORT
  // ------------------------------------------------------------------------
  useEffect(() => {
    if (!isMapViewTab) return;

    const savedRaw = localStorage.getItem('josaa_map_payload');
    const parsedData = savedRaw ? JSON.parse(savedRaw) : [];
    setMapData(parsedData);

    if (!window.L) {
      const css = document.createElement('link');
      css.rel = 'stylesheet'; css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(css);

      const js = document.createElement('script');
      js.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      js.async = true;
      js.onload = () => initMap(parsedData);
      document.body.appendChild(js);
    } else {
      initMap(parsedData);
    }

    function initMap(dataset) {
      if (!mapContainerRef.current || mapObjectRef.current) return;
      
      const map = window.L.map(mapContainerRef.current).setView([22.9734, 78.6568], 5);
      
      window.L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
      }).addTo(map);

      window.L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png').addTo(map);

      const bounds = [];
      dataset.forEach(row => {
        const instLower = row.Institute.toLowerCase();
        let coords = null;
        
        for (const key in COLLEGE_COORDINATES) {
          const regex = new RegExp('\\b' + key + '\\b', 'i');
          if (regex.test(instLower)) { coords = COLLEGE_COORDINATES[key]; break; }
        }

        if (coords) {
          bounds.push(coords);

          let dotColor = '#166534';
          let statusText = 'Safe Bets 🟢';
          
          if (row.Admission_Chance.includes('Moderate')) {
            dotColor = '#f59e0b';
            statusText = 'Moderate Target 🟡';
          } else if (row.Admission_Chance.includes('Risky')) {
            dotColor = '#dc2626';
            statusText = 'Ambitious Reach 🔴';
          }

          const marker = window.L.circleMarker(coords, {
            radius: row.isLiveMatch ? 12 : 8,
            fillColor: dotColor,
            color: '#ffffff', 
            weight: 2,
            fillOpacity: 0.85
          });

          marker.bindPopup(`
            <div style="font-family: system-ui, sans-serif; font-size:12px; min-width:220px; padding:2px;">
              <b style="color: #0a2417; font-size:13px; display:block; margin-bottom:4px;">${row.Institute}</b>
              <div style="color: #475569; margin-bottom:6px; line-height:1.4;">${row.Branch}</div>
              <hr style="border:0; border-top:1px solid #e2e8f0; margin:6px 0;" />
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <span style="font-size:11px; font-weight:700; color:#475569;">${statusText}</span>
                <span style="font-weight:800; color:${dotColor}; font-size:13px;">Cutoff: ${row.Median_Cutoff.toLocaleString('en-IN')}</span>
              </div>
            </div>
          `);
          marker.addTo(map);
        }
      });

      if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [60, 60], maxZoom: 6 });
      } else {
        map.setView([22.9734, 78.6568], 5);
      }
      mapObjectRef.current = map;
    }
  }, [isMapViewTab]);

  if (isMapViewTab) {
    return (
      <div style={{ width: '100vw', height: '100vh', position: 'relative', fontFamily: 'sans-serif' }}>
        <div style={{ position: 'absolute', top: '15px', left: '60px', zIndex: 1000, backgroundColor: '#0a2417', color: '#fff', padding: '12px 20px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.15)', borderBottom: '2px solid #d4af37' }}>
          <h3 style={{ margin: 0, fontSize: '15px' }}>📍 Spatial Distribution Index Map (India)</h3>
          <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#a3b899' }}>Displaying active page batch selections ({mapData.length} colleges plotted).</p>
        </div>

        <div style={{ position: 'absolute', bottom: '30px', right: '20px', zIndex: 1000, backgroundColor: '#ffffff', padding: '14px 18px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.12)', border: '1px solid #cbd5e1', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ fontSize: '11px', fontWeight: '800', color: '#0a2417', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px' }}>Admission Probability</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: '600', color: '#334155' }}>
            <span style={{ width: '14px', height: '14px', backgroundColor: '#166534', borderRadius: '50%', display: 'inline-block', border: '1px solid #fff', boxShadow: '0 0 0 1px #166534' }} /> Safe Bets (Green)
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: '600', color: '#334155' }}>
            <span style={{ width: '14px', height: '14px', backgroundColor: '#f59e0b', borderRadius: '50%', display: 'inline-block', border: '1px solid #fff', boxShadow: '0 0 0 1px #f59e0b' }} /> Moderate Targets (Yellow)
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: '600', color: '#334155' }}>
            <span style={{ width: '14px', height: '14px', backgroundColor: '#dc2626', borderRadius: '50%', display: 'inline-block', border: '1px solid #fff', boxShadow: '0 0 0 1px #dc2626' }} /> Ambitious Reaches (Red)
          </div>
        </div>

        <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
      </div>
    );
  }

  // ------------------------------------------------------------------------
  // SUB-COMPONENT ROUTE B: MAIN ANALYTICS DASHBOARD VIEWPORT
  // ------------------------------------------------------------------------
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePredict = async (e) => {
    e.preventDefault();
    if (!formData.rank) { alert("Please enter your JEE Main Rank."); return; }

    setLoading(true);
    setSearched(true);
    setVisibleCount(20);

    try {
      const queryParams = new URLSearchParams({
        rank: formData.rank, category: formData.category, gender: formData.gender, quota: formData.quota
      });
      if (formData.advancedRank.trim() !== '') queryParams.append('advanced_rank', formData.advancedRank);

      const response = await fetch(`https://josaa-backend-api-ock8.onrender.com/predict/?${queryParams}`);
      const data = await response.json();

      if (response.ok) {
        const fetchedResults = data.results || [];
        setResults(fetchedResults);
        setTotalOptions(data.total_options_found || 0);
        
        // Accurate explicit filtering condition for real IIT systems
        const hasIITs = fetchedResults.some(r => {
          const n = r.Institute.toLowerCase();
          return n.includes('indian institute of technology') && !n.includes('engineering science');
        });

        if (formData.advancedRank.trim() !== '' && hasIITs) {
          setActiveMasterTab('IIT');
        } else {
          setActiveMasterTab('Other');
        }
        setActiveSubTab('Safe');
      }
    } catch (error) {
      alert("Failed to establish connection with backend.");
    } finally {
      setLoading(false);
    }
  };

  // Bulletproof institutional separation logic
  const iitPool = results.filter(r => {
    const n = r.Institute.toLowerCase();
    return n.includes('indian institute of technology') && !n.includes('engineering science');
  });
  const otherPool = results.filter(r => !iitPool.includes(r));
  
  const masterSet = activeMasterTab === 'IIT' ? iitPool : otherPool;
  const currentSubSet = masterSet.filter(r => r.Admission_Chance.includes(activeSubTab));

  const instQuery = formData.institute.toLowerCase().trim();
  const branchQuery = formData.branch.toLowerCase().trim();
  const isFiltering = instQuery !== '' || branchQuery !== '';

  let displayedDataset = [];
  let filterStatus = 'none';

  if (isFiltering) {
    const matches = currentSubSet.filter(r => {
      const mInst = instQuery === '' || r.Institute.toLowerCase().includes(instQuery);
      const mBranch = branchQuery === '' || r.Branch.toLowerCase().includes(branchQuery);
      return mInst && mBranch;
    });

    if (matches.length > 0) {
      filterStatus = 'matched';
      const nonMatches = currentSubSet.filter(r => !matches.includes(r));
      displayedDataset = [...matches.map(r => ({ ...r, isLiveMatch: true })), ...nonMatches.map(r => ({ ...r, isLiveMatch: false }))];
    } else {
      filterStatus = 'failed';
      displayedDataset = currentSubSet.map(r => ({ ...r, isLiveMatch: false }));
    }
  } else {
    displayedDataset = currentSubSet.map(r => ({ ...r, isLiveMatch: false }));
  }

  const paginatedDataset = displayedDataset.slice(0, visibleCount);

  const getDynamicStyles = () => {
    if (activeSubTab === 'Safe') return { bg: '#f0fdf4', color: '#166534', header: '#e8f2ed' };
    if (activeSubTab === 'Moderate') return { bg: '#fffbeb', color: '#b45309', header: '#fef9c3' };
    return { bg: '#fff5f5', color: '#991b1b', header: '#fee2e2' };
  };
  const ui = getDynamicStyles();

  const handleOpenMapWindow = () => {
    localStorage.setItem('josaa_map_payload', JSON.stringify(paginatedDataset));
    window.open(window.location.pathname + '?view=map', '_blank');
  };

  const handleDownloadPDF = () => {
    const printWindow = window.open('', '_blank');
    const timestamp = new Date().toLocaleString('en-IN');
    const generateTableRowsPDF = (dataset) => {
      if (dataset.length === 0) return `<tr><td colspan="4" style="text-align: center; color: #667b70; font-style: italic;">No options identified.</td></tr>`;
      return dataset.map((row, idx) => `
        <tr>
          <td style="text-align: center; font-weight: bold; color: #71717a;">${idx + 1}</td>
          <td><b>${row.Institute}</b></td>
          <td>${row.Branch}</td>
          <td style="text-align: right; font-weight: 700; color: #0a2417;">${row.Median_Cutoff.toLocaleString('en-IN')}</td>
        </tr>
      `).join('');
    };

    printWindow.document.write(`
      <html>
        <head>
          <title>JoSAA Preference Analysis Allotment Report</title>
          <style>
            body { font-family: sans-serif; color: #0a2417; margin: 40px; }
            .header-banner { border-bottom: 3px solid #d4af37; padding-bottom: 12px; margin-bottom: 24px; }
            .meta-card { background: #f4f7f5; border: 1px solid #d1eae1; padding: 16px; border-radius: 12px; margin-bottom: 30px; }
            .meta-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; font-size: 12px; }
            .meta-label { font-weight: 700; color: #3f5147; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
            .meta-val { font-size: 13px; font-weight: 600; margin-top: 2px; }
            .section-header { font-size: 13px; font-weight: 800; padding: 8px 14px; border-radius: 6px; margin-top: 28px; margin-bottom: 12px; text-transform: uppercase; }
            .sh-safe { background-color: #dcfce7; color: #15803d; border-left: 5px solid #166534; }
            .sh-mod { background-color: #fef9c3; color: #a16207; border-left: 5px solid #854d0e; }
            .sh-risk { background-color: #fee2e2; color: #b91c1c; border-left: 5px solid #991b1b; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; }
            th { background-color: #0a2417; color: #ffffff; padding: 10px 14px; font-weight: 700; text-align: left; text-transform: uppercase; font-size: 11px; }
            td { padding: 10px 14px; border-bottom: 1px solid #e8f2ed; color: #2c3e35; }
            tr:nth-child(odd) { background-color: #fafbfc; }
          </style>
        </head>
        <body>
          <div class="header-banner">
            <h2>🎓 JoSAA Predictive Choice Priority Report</h2>
            <p>Target Index Stream: ${activeMasterTab === 'IIT' ? 'IIT Program Metrics' : 'NITs / IIITs / GFTIs Sub-system'}</p>
          </div>
          <div class="meta-card">
            <div class="meta-grid">
              <div><div class="meta-label">JEE Main Rank</div><div class="meta-val">${Number(formData.rank).toLocaleString('en-IN')}</div></div>
              <div><div class="meta-label">JEE Advanced Rank</div><div class="meta-val">${formData.advancedRank ? Number(formData.advancedRank).toLocaleString('en-IN') : 'Not Configured'}</div></div>
              <div><div class="meta-label">Seat Category</div><div class="meta-val">${formData.category}</div></div>
              <div><div class="meta-label">Gender Pool</div><div class="meta-val">${formData.gender}</div></div>
              <div><div class="meta-label">Quota Pool</div><div class="meta-val">${formData.quota}</div></div>
              <div><div class="meta-label">Compiled Timestamp</div><div class="meta-val">${timestamp}</div></div>
            </div>
          </div>
          <div class="section-header sh-safe">🟢 Safe Bets (Total: ${masterSet.filter(r => r.Admission_Chance.includes('Safe')).length})</div>
          <table><thead><tr><th style="text-align:center; width:60px;">S.No</th><th>Institute Name</th><th>Academic Program (Branch)</th><th style="text-align:right;">Median Cutoff</th></tr></thead><tbody>${generateTableRowsPDF(masterSet.filter(r => r.Admission_Chance.includes('Safe')))}</tbody></table>
          <div class="section-header sh-mod">🟡 Moderate Targets (Total: ${masterSet.filter(r => r.Admission_Chance.includes('Moderate')).length})</div>
          <table><thead><tr><th style="text-align:center; width:60px;">S.No</th><th>Institute Name</th><th>Academic Program (Branch)</th><th style="text-align:right;">Median Cutoff</th></tr></thead><tbody>${generateTableRowsPDF(masterSet.filter(r => r.Admission_Chance.includes('Moderate')))}</tbody></table>
          <div class="section-header sh-risk">🔴 Ambitious Reaches (Total: ${masterSet.filter(r => r.Admission_Chance.includes('Risky')).length})</div>
          <table><thead><tr><th style="text-align:center; width:60px;">S.No</th><th>Institute Name</th><th>Academic Program (Branch)</th><th style="text-align:right;">Median Cutoff</th></tr></thead><tbody>${generateTableRowsPDF(masterSet.filter(r => r.Admission_Chance.includes('Risky')))}</tbody></table>
        </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 350);
  };

  return (
    <div style={styles.container}>
      <Analytics />
      <style>{`
        html, body, #root { background-color: #f4f7f5 !important; color: #0a2417 !important; color-scheme: light !important; }
        input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }
      `}</style>

      <header style={styles.header}>
        <h1 style={styles.title}>🎓 JoSAA College Predictor</h1>
        <p style={styles.subtitle}>Intelligent Allocation Engineering & Trend Analytics Dashboard</p>
      </header>

      <div style={styles.mainVerticalLayout}>
        <div style={styles.topControlPanel}>
          <form onSubmit={handlePredict} style={styles.form}>
            <div style={styles.gridRow5Way}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>JEE Main Rank (CRL/Category) *</label>
                <input type="number" name="rank" placeholder="e.g., 12000" value={formData.rank} onChange={handleChange} style={styles.input} />
              </div>
              <div style={styles.inputGroup}>
                <label style={{...styles.label, color: '#b45309'}}>JEE Advanced Rank (Optional)</label>
                <input type="number" name="advancedRank" placeholder="Leave blank if none" value={formData.advancedRank} onChange={handleChange} style={{...styles.input, borderColor: '#d4af37'}} />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Seat Category</label>
                <select name="category" value={formData.category} onChange={handleChange} style={styles.select}>
                  <option value="OPEN">OPEN (General)</option>
                  <option value="OBC-NCL">OBC-NCL</option>
                  <option value="SC">SC</option><option value="ST">ST</option><option value="EWS">EWS</option>
                </select>
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Gender Pool</label>
                <select name="gender" value={formData.gender} onChange={handleChange} style={styles.select}>
                  <option value="Gender-Neutral">Gender-Neutral</option>
                  <option value="Female-only (including Supernumerary)">Female-only</option>
                </select>
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Quota Allocation</label>
                <select name="quota" value={formData.quota} onChange={handleChange} style={styles.select}>
                  <option value="AI">All India (AI)</option><option value="HS">Home State (HS)</option><option value="OS">Other State (OS)</option>
                 </select>
              </div>
            </div>

            <div style={styles.optionalFilterStrip}>
              <div style={styles.filterBadge}>⚡ Instant Filter</div>
              <input type="text" name="institute" placeholder="Type Institute keyword (e.g., Hamirpur, Mandi)..." value={formData.institute} onChange={handleChange} style={{...styles.input, flex: 2}} />
              <input type="text" name="branch" placeholder="Type Branch keyword (e.g., Computer, Data)..." value={formData.branch} onChange={handleChange} style={{...styles.input, flex: 2}} />
              <button type="submit" style={styles.actionButton} disabled={loading}>{loading ? "Analyzing..." : "Generate Predictions 🚀"}</button>
            </div>
          </form>
        </div>

        <div style={styles.bottomOutputArea}>
          {!loading && searched && results.length > 0 && (
            <div>
              <div style={styles.actionSummaryHeaderRow}>
                <div style={styles.summaryBarText}>
                  🎉 Data Sync Complete: Identified <strong>{totalOptions}</strong> options. {isFiltering && filterStatus === 'matched' && "(Applying live keyword priority floats)"}
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={handleOpenMapWindow} style={styles.mapTabLaunchButton}>
                    View Choices on Map (New Tab) 🗺️
                  </button>
                  <button onClick={handleDownloadPDF} style={styles.pdfDownloadButton}>
                    Download Report (PDF) 📄
                  </button>
                </div>
              </div>

              {filterStatus === 'failed' && ( <div style={styles.filterWarningBanner}>⚠️ No results matched filter criteria. Showing full index checklist list below.</div> )}
              {filterStatus === 'matched' && ( <div style={styles.filterSuccessBanner}>✨ Floating matched keyword selections to the top of the table panel below.</div> )}

              <div style={styles.masterTabContainer}>
                <button onClick={() => { setActiveMasterTab('IIT'); setVisibleCount(20); }} style={{...styles.masterTab, ...(activeMasterTab === 'IIT' ? styles.masterTabActive : {}), color: formData.advancedRank.trim() === '' ? '#71717a' : '#0a2417'}} disabled={formData.advancedRank.trim() === ''}>
                  🏫 IIT Options {formData.advancedRank.trim() === '' ? '(Advanced Rank Unconfigured)' : `(${iitPool.length})`}
                </button>
                <button onClick={() => { setActiveMasterTab('Other'); setVisibleCount(20); }} style={{...styles.masterTab, ...(activeMasterTab === 'Other' ? styles.masterTabActive : {})}}>
                  🏛️ NITs / IIITs / GFTIs ({otherPool.length} choices)
                </button>
              </div>

              <div style={styles.subTabContainer}>
                {['Safe', 'Moderate', 'Risky'].map(type => {
                  const isSelected = activeSubTab === type;
                  const count = masterSet.filter(r => r.Admission_Chance.includes(type)).length;
                  let customTabStyle = { ...styles.subTab };
                  if (type === 'Safe') customTabStyle = { ...customTabStyle, ...(isSelected ? styles.subActiveSafe : styles.subInactiveSafe) };
                  if (type === 'Moderate') customTabStyle = { ...customTabStyle, ...(isSelected ? styles.subActiveMod : styles.subInactiveMod) };
                  if (type === 'Risky') customTabStyle = { ...customTabStyle, ...(isSelected ? styles.subActiveRisk : styles.subInactiveRisk) };

                  return (
                    <button key={type} onClick={() => { setActiveSubTab(type); setVisibleCount(20); }} style={customTabStyle}>
                      {type === 'Safe' ? '🟢 Safe Bets' : type === 'Moderate' ? '🟡 Moderate Targets' : '🔴 Ambitious Reaches'} ({count})
                    </button>
                  );
                })}
              </div>

              {paginatedDataset.length === 0 ? (
                <div style={styles.emptyCard}><h4>No allocation records found inside this specific tab index block.</h4></div>
              ) : (
                <div>
                  <div style={styles.tableWrapper}>
                    <table style={styles.table}>
                      <thead style={{backgroundColor: ui.header}}>
                        <tr>
                          <th style={{...styles.th, width: '45%'}}>Institute Name</th>
                          <th style={{...styles.th, width: '40%'}}>Academic Program (Branch Specification)</th>
                          <th style={{...styles.th, width: '15%', textAlign: 'right', paddingRight: '24px'}}>Historical Median Cutoff</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedDataset.map((row, index) => {
                          const matchAccentStyle = row.isLiveMatch ? { borderLeft: `5px solid ${ui.color}`, backgroundColor: '#ffffff' } : { borderLeft: '5px solid transparent' };
                          return (
                            <tr key={index} style={{ ...matchAccentStyle, backgroundColor: row.isLiveMatch ? '#ffffff' : (index % 2 !== 0 ? ui.bg : '#ffffff') }}>
                              <td style={styles.td}>
                                {row.isLiveMatch && <span style={styles.matchIndicatorBadge}>MATCH</span>}
                                <strong>{row.Institute}</strong>
                              </td>
                              <td style={styles.td}>{row.Branch}</td>
                              <td style={{...styles.td, textAlign: 'right', fontWeight: '800', color: ui.color, fontSize: '14px', paddingRight: '24px'}}>
                                {row.Median_Cutoff.toLocaleString('en-IN')}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {displayedDataset.length > visibleCount && (
                    <div style={styles.loadMoreContainer}>
                      <button onClick={() => setVisibleCount(prev => prev + 20)} style={styles.loadMoreButton}>
                        Show More Options (+20 Rows) 🔽
                        <span style={{ fontSize: '11px', opacity: 0.7, marginLeft: '6px' }}>(Viewing {visibleCount} of {displayedDataset.length})</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          {loading && <div style={styles.loading}>⚡ Correlating allocation metrics over comprehensive dataset arrays...</div>}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { backgroundColor: '#f4f7f5', minHeight: '100vh', paddingBottom: '60px' },
  header: { backgroundColor: '#0a2417', color: '#ffffff', padding: '20px 40px', borderBottom: '3px solid #d4af37' },
  title: { margin: 0, fontSize: '24px', fontWeight: '800', letterSpacing: '-0.5px' },
  subtitle: { margin: '2px 0 0 0', opacity: 0.75, fontSize: '12px', color: '#a3b899' },
  mainVerticalLayout: { maxWidth: '1440px', margin: '24px auto', padding: '0 24px', display: 'flex', flexDirection: 'column', gap: '24px' },
  topControlPanel: { backgroundColor: '#ffffff', padding: '24px', borderRadius: '16px', border: '1px solid #d1eae1', boxShadow: '0 4px 12px rgba(11,92,50,0.02)' },
  form: { display: 'flex', flexDirection: 'column', gap: '16px' },
  gridRow5Way: { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', alignItems: 'end' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '11px', fontWeight: '800', color: '#3f5147', textTransform: 'uppercase', letterSpacing: '0.3px' },
  input: { padding: '11px 14px', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', width: '100%', backgroundColor: '#ffffff', color: '#0a2417', border: '2px solid #a3d9c9' },
  select: { padding: '11px 14px', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', boxSizing: 'border-box', width: '100%', backgroundColor: '#ffffff', color: '#0a2417', border: '2px solid #a3d9c9' },
  optionalFilterStrip: { backgroundColor: '#edf2ee', padding: '12px 16px', borderRadius: '12px', display: 'flex', gap: '16px', alignItems: 'center', border: '1px solid #d1eae1' },
  filterBadge: { fontSize: '10px', fontWeight: '900', backgroundColor: '#115c32', color: '#ffffff', padding: '6px 12px', borderRadius: '6px', letterSpacing: '0.5px', textTransform: 'uppercase' },
  actionButton: { padding: '11px 24px', backgroundColor: '#0a2417', color: '#ffffff', border: 0, borderRadius: '8px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 12px rgba(10,36,23,0.2)' },
  filterWarningBanner: { backgroundColor: '#fff7ed', color: '#c2410c', border: '1px solid #ffedd5', borderLeft: '5px solid #ea580c', padding: '12px 20px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' },
  filterSuccessBanner: { backgroundColor: '#f0fdf4', color: '#166534', border: '1px solid #dcfce7', borderLeft: '5px solid #16a34a', padding: '12px 20px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' },
  matchIndicatorBadge: { backgroundColor: '#0a2417', color: '#ffffff', fontSize: '9px', fontWeight: '800', padding: '2px 6px', borderRadius: '4px', marginRight: '8px', verticalAlign: 'middle' },
  bottomOutputArea: { width: '100%' },
  actionSummaryHeaderRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#d1eae1', padding: '12px 20px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #a3d9c9', gap: '16px' },
  summaryBarText: { color: '#0a2417', fontWeight: '500', fontSize: '14px' },
  mapTabLaunchButton: { backgroundColor: '#115c32', color: '#ffffff', border: 0, padding: '10px 18px', borderRadius: '8px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', boxShadow: '0 2px 6px rgba(17,92,50,0.15)' },
  pdfDownloadButton: { backgroundColor: '#0a2417', color: '#ffffff', border: 0, padding: '10px 18px', borderRadius: '8px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', boxShadow: '0 2px 6px rgba(10,36,23,0.15)' },
  masterTabContainer: { display: 'flex', gap: '4px', backgroundColor: '#d1eae1', borderRadius: '16px 16px 0 0', padding: '6px 6px 0 6px' },
  masterTab: { flex: 1, padding: '14px', border: 0, borderRadius: '12px 12px 0 0', cursor: 'pointer', fontSize: '14px', fontWeight: '700', color: '#2c3e35', backgroundColor: 'transparent', transition: 'all 0.15s ease' },
  masterTabActive: { backgroundColor: '#ffffff', color: '#0a2417 !important', boxShadow: '0 -2px 10px rgba(0,0,0,0.02)' },
  subTabContainer: { display: 'flex', gap: '12px', padding: '16px 20px', backgroundColor: '#ffffff', borderLeft: '1px solid #d1eae1', borderRight: '1px solid #d1eae1', borderBottom: '2px solid #e2e8f0' },
  subTab: { padding: '10px 20px', borderRadius: '30px', cursor: 'pointer', fontSize: '13px', fontWeight: '700', transition: 'all 0.2s', outline: 'none' },
  subInactiveSafe: { backgroundColor: '#ffffff', color: '#166534', border: '2px solid #bbf7d0' },
  subInactiveMod: { backgroundColor: '#ffffff', color: '#b45309', border: '2px solid #fde68a' },
  subInactiveRisk: { backgroundColor: '#ffffff', color: '#991b1b', border: '2px solid #fecaca' },
  subActiveSafe: { backgroundColor: '#166534', color: '#ffffff', border: '2px solid #166534', boxShadow: '0 4px 10px rgba(22,101,52,0.15)' },
  subActiveMod: { backgroundColor: '#b45309', color: '#ffffff', border: '2px solid #b45309', boxShadow: '0 4px 10px rgba(180,83,9,0.15)' },
  subActiveRisk: { backgroundColor: '#991b1b', color: '#ffffff', border: '2px solid #991b1b', boxShadow: '0 4px 10px rgba(153,27,27,0.15)' },
  tableWrapper: { backgroundColor: '#ffffff', borderRadius: '0 0 16px 16px', overflow: 'hidden', border: '1px solid #d1eae1', borderTop: 0, boxShadow: '0 4px 12px rgba(0,0,0,0.02)', width: '100%' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '14px' },
  th: { padding: '16px 20px', textAlign: 'left', color: '#0a2417', fontWeight: '700' },
  td: { padding: '16px 20px', borderBottom: '1px solid #e8f2ed', color: '#2c3e35', verticalAlign: 'middle' },
  loading: { textAlign: 'center', padding: '60px', fontSize: '14px', fontWeight: '600', color: '#115c32', backgroundColor: '#ffffff', borderRadius: '0 0 16px 16px', border: '1px solid #d1eae1', borderTop: 0 },
  emptyCard: { textAlign: 'center', padding: '60px', backgroundColor: '#ffffff', color: '#667b70', borderRadius: '0 0 16px 16px', border: '1px solid #d1eae1', borderTop: 0 },
  loadMoreContainer: { display: 'flex', justifyContent: 'center', margin: '24px 0 0 0' },
  loadMoreButton: { backgroundColor: '#ffffff', color: '#0a2417', border: '2px solid #115c32', padding: '10px 28px', borderRadius: '30px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }
};

export default App;