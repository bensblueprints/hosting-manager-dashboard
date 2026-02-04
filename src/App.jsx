import { useState, useEffect, useCallback } from 'react';
import {
  Globe, Database, Lock, Unlock, Shield, AlertTriangle,
  ExternalLink, Search, RefreshCw, Settings,
  Server, GitBranch, Link2, CheckCircle, XCircle,
  ChevronDown, ChevronRight, Star, Clock,
  HardDrive, Activity, Zap, LogOut, User, Plus,
  Rocket, Trash2, Play, FolderOpen, Terminal,
  Cloud, Wifi, Home
} from 'lucide-react';
import './App.css';

const API_BASE = '/.netlify/functions';

function App() {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authToken, setAuthToken] = useState(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Main state
  const [activeView, setActiveView] = useState('sites');
  const [sites, setSites] = useState([]);
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locks, setLocks] = useState({});
  const [selectedSite, setSelectedSite] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  // Modals
  const [showCreateSite, setShowCreateSite] = useState(false);
  const [showAddDomain, setShowAddDomain] = useState(false);
  const [createSiteData, setCreateSiteData] = useState({ name: '', repoUrl: '', branch: 'main', buildCommand: 'npm run build', publishDir: 'dist' });
  const [addDomainData, setAddDomainData] = useState({ siteId: '', domain: '', subdomain: '' });

  // Database state
  const [dbStats, setDbStats] = useState(null);
  const [tables, setTables] = useState([]);
  const [selectedSchema, setSelectedSchema] = useState('public');

  // Categories for sites
  const [expandedCategories, setExpandedCategories] = useState({
    core: true, tools: true, products: true, rootaccess: true, other: true
  });

  // Check existing session on load
  useEffect(() => {
    const token = localStorage.getItem('hosting-manager-token');
    if (token) {
      verifySession(token);
    }
  }, []);

  const verifySession = async (token) => {
    try {
      const res = await fetch(`${API_BASE}/db-operations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ action: 'verify-session' })
      });
      const data = await res.json();
      if (data.valid) {
        setAuthToken(token);
        setIsAuthenticated(true);
        loadData(token);
      } else {
        localStorage.removeItem('hosting-manager-token');
      }
    } catch (err) {
      console.error('Session verify error:', err);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    try {
      const res = await fetch(`${API_BASE}/db-operations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', email: loginEmail, password: loginPassword })
      });
      const data = await res.json();

      if (data.success) {
        setAuthToken(data.token);
        setIsAuthenticated(true);
        localStorage.setItem('hosting-manager-token', data.token);
        loadData(data.token);
      } else {
        setLoginError(data.error || 'Invalid credentials');
      }
    } catch (err) {
      setLoginError('Connection error. Please try again.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    if (authToken) {
      await fetch(`${API_BASE}/db-operations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
        body: JSON.stringify({ action: 'logout' })
      });
    }
    setIsAuthenticated(false);
    setAuthToken(null);
    localStorage.removeItem('hosting-manager-token');
  };

  const loadData = useCallback(async (token) => {
    setLoading(true);
    try {
      // Load sites
      const sitesRes = await fetch(`${API_BASE}/site-management`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ action: 'list-sites' })
      });
      const sitesData = await sitesRes.json();
      if (sitesData.sites) {
        setSites(categorize(sitesData.sites));
      }

      // Load locks
      const locksRes = await fetch(`${API_BASE}/db-operations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ action: 'get-locks' })
      });
      const locksData = await locksRes.json();
      if (locksData.locks) {
        setLocks(locksData.locks);
      }

      // Load GitHub repos
      const reposRes = await fetch(`${API_BASE}/site-management`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ action: 'list-github-repos' })
      });
      const reposData = await reposRes.json();
      if (reposData.repos) {
        setRepos(reposData.repos);
      }
    } catch (err) {
      console.error('Load data error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const categorize = (sites) => {
    return sites.map(site => {
      let category = 'other';
      if (site.domain?.includes('advancedmarketing') || site.name?.includes('advanced-marketing')) {
        category = 'core';
      } else if (site.name?.includes('dashboard') || site.name?.includes('tool') || site.name?.includes('manager')) {
        category = 'tools';
      } else if (site.domain?.includes('rootaccess') || site.name?.includes('rootaccess')) {
        category = 'rootaccess';
      } else if (site.name?.includes('saas') || site.name?.includes('pro') || site.name?.includes('app')) {
        category = 'products';
      }
      return { ...site, category };
    });
  };

  const toggleLock = async (siteId, siteName, currentlyLocked) => {
    const newLocked = !currentlyLocked;
    setLocks(prev => ({ ...prev, [siteId]: { ...prev[siteId], locked: newLocked } }));

    await fetch(`${API_BASE}/db-operations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
      body: JSON.stringify({ action: 'set-lock', siteId, siteName, locked: newLocked })
    });
  };

  const triggerDeploy = async (siteId) => {
    try {
      const res = await fetch(`${API_BASE}/site-management`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
        body: JSON.stringify({ action: 'trigger-deploy', siteId })
      });
      const data = await res.json();
      if (data.success) {
        alert('Deploy triggered successfully!');
      } else {
        alert('Deploy failed: ' + data.error);
      }
    } catch (err) {
      alert('Error triggering deploy');
    }
  };

  const createSite = async () => {
    try {
      const res = await fetch(`${API_BASE}/site-management`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
        body: JSON.stringify({ action: 'create-site', ...createSiteData })
      });
      const data = await res.json();
      if (data.success) {
        alert(`Site created: ${data.site.name}`);
        setShowCreateSite(false);
        setCreateSiteData({ name: '', repoUrl: '', branch: 'main', buildCommand: 'npm run build', publishDir: 'dist' });
        loadData(authToken);
      } else {
        alert('Failed to create site: ' + data.error);
      }
    } catch (err) {
      alert('Error creating site');
    }
  };

  const addDomain = async () => {
    try {
      const res = await fetch(`${API_BASE}/domain-management`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
        body: JSON.stringify({ action: 'add-domain', ...addDomainData })
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        setShowAddDomain(false);
        setAddDomainData({ siteId: '', domain: '', subdomain: '' });
        loadData(authToken);
      } else {
        alert('Failed to add domain: ' + data.error);
      }
    } catch (err) {
      alert('Error adding domain');
    }
  };

  const loadDbStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/neon-management`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
        body: JSON.stringify({ action: 'get-db-stats' })
      });
      const data = await res.json();
      setDbStats(data);

      if (data.schemas?.length > 0) {
        loadTables(data.schemas[0]);
      }
    } catch (err) {
      console.error('Error loading db stats:', err);
    }
  };

  const loadTables = async (schema) => {
    setSelectedSchema(schema);
    try {
      const res = await fetch(`${API_BASE}/neon-management`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
        body: JSON.stringify({ action: 'list-tables', schema })
      });
      const data = await res.json();
      setTables(data.tables || []);
    } catch (err) {
      console.error('Error loading tables:', err);
    }
  };

  useEffect(() => {
    if (activeView === 'databases' && isAuthenticated) {
      loadDbStats();
    }
  }, [activeView, isAuthenticated]);

  const filteredSites = sites.filter(site => {
    const matchesSearch = search === '' ||
      site.name?.toLowerCase().includes(search.toLowerCase()) ||
      site.domain?.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' ||
      (filter === 'locked' && locks[site.id]?.locked) ||
      (filter === 'unlocked' && !locks[site.id]?.locked) ||
      (filter === 'with-domain' && site.domain);
    return matchesSearch && matchesFilter;
  });

  const categoryLabels = {
    core: 'Core Sites (Advanced Marketing)',
    tools: 'Tools & Dashboards',
    products: 'Products & SaaS',
    rootaccess: 'Root Access Design',
    other: 'Other Sites'
  };

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <Shield size={48} />
            <h1>Hosting Manager</h1>
            <p>Sign in to manage your sites and deployments</p>
          </div>
          <form className="login-form" onSubmit={handleLogin}>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                placeholder="admin@advancedmarketing.co"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                placeholder="Enter your password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
              />
            </div>
            {loginError && <div className="login-error">{loginError}</div>}
            <button type="submit" className="login-btn" disabled={loginLoading}>
              {loginLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Sites View
  const renderSitesView = () => (
    <>
      <header className="content-header">
        <div className="header-left">
          <h2>Netlify Sites</h2>
          <p>Manage and protect your deployments</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={() => setShowCreateSite(true)}>
            <Plus size={16} /> New Site
          </button>
          <button className="btn btn-secondary" onClick={() => loadData(authToken)}>
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </header>

      <div className="filters">
        <div className="search-box">
          <Search size={18} />
          <input type="text" placeholder="Search sites or domains..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="filter-buttons">
          {['all', 'locked', 'unlocked', 'with-domain'].map(f => (
            <button key={f} className={`filter-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
              {f === 'locked' && <Lock size={14} />}
              {f === 'unlocked' && <Unlock size={14} />}
              {f === 'with-domain' && <Globe size={14} />}
              {f === 'all' ? 'All' : f === 'locked' ? 'Locked' : f === 'unlocked' ? 'Unlocked' : 'Custom Domain'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading sites...</div>
      ) : (
        <div className="sites-container">
          {Object.entries(categoryLabels).map(([catKey, catLabel]) => {
            const catSites = filteredSites.filter(s => s.category === catKey);
            if (catSites.length === 0) return null;
            return (
              <div key={catKey} className="category-section">
                <button className="category-header" onClick={() => setExpandedCategories(prev => ({ ...prev, [catKey]: !prev[catKey] }))}>
                  {expandedCategories[catKey] ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  <span>{catLabel}</span>
                  <span className="category-count">{catSites.length}</span>
                </button>
                {expandedCategories[catKey] && (
                  <div className="sites-grid">
                    {catSites.map(site => (
                      <div key={site.id} className={`site-card ${locks[site.id]?.locked ? 'locked' : ''} ${selectedSite?.id === site.id ? 'selected' : ''}`}>
                        <div className="site-card-header">
                          <div className="site-name"><Server size={16} /><span>{site.name}</span></div>
                          <button className={`lock-btn ${locks[site.id]?.locked ? 'locked' : ''}`} onClick={() => toggleLock(site.id, site.name, locks[site.id]?.locked)}>
                            {locks[site.id]?.locked ? <Lock size={16} /> : <Unlock size={16} />}
                          </button>
                        </div>
                        <div className="site-domain">
                          {site.domain ? (
                            <a href={site.url} target="_blank" rel="noopener noreferrer">
                              <Globe size={14} />{site.domain}<ExternalLink size={12} />
                            </a>
                          ) : (
                            <span className="no-domain"><Globe size={14} />{site.defaultDomain}</span>
                          )}
                        </div>
                        <div className="site-actions">
                          <a href={site.url} target="_blank" rel="noopener noreferrer" className="action-btn launch" title="Launch Site">
                            <Rocket size={14} /> Launch
                          </a>
                          <a href={site.adminUrl} target="_blank" rel="noopener noreferrer" className="action-btn admin" title="Netlify Admin">
                            <Settings size={14} /> Admin
                          </a>
                          <button className="action-btn deploy" onClick={() => triggerDeploy(site.id)} title="Trigger Deploy" disabled={locks[site.id]?.locked}>
                            <Play size={14} /> Deploy
                          </button>
                        </div>
                        <div className="site-id"><code>{site.id.substring(0, 8)}...</code></div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );

  // GitHub View
  const renderGitHubView = () => (
    <>
      <header className="content-header">
        <div className="header-left">
          <h2>GitHub Repositories</h2>
          <p>Manage your source code and deployments</p>
        </div>
        <a href="https://github.com/bensblueprints?tab=repositories" target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
          <ExternalLink size={16} /> View on GitHub
        </a>
      </header>

      <div className="repos-grid">
        {repos.map(repo => (
          <div key={repo.id} className="repo-card">
            <div className="repo-header">
              <GitBranch size={20} className="repo-icon" />
              <div className="repo-name">{repo.name}</div>
            </div>
            <p className="repo-description">{repo.description || 'No description'}</p>
            <div className="repo-meta">
              {repo.language && (
                <span className="repo-language">
                  <span className={`lang-dot ${repo.language?.toLowerCase()}`}></span>
                  {repo.language}
                </span>
              )}
              <span className="repo-stars"><Star size={14} /> {repo.stars}</span>
            </div>
            <div className="repo-actions">
              <a href={repo.url} target="_blank" rel="noopener noreferrer" className="action-btn">
                <ExternalLink size={14} /> Open
              </a>
              <button className="action-btn" onClick={() => { setCreateSiteData({ ...createSiteData, repoUrl: repo.cloneUrl, name: repo.name }); setShowCreateSite(true); }}>
                <Rocket size={14} /> Deploy
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );

  // Databases View
  const renderDatabasesView = () => (
    <>
      <header className="content-header">
        <div className="header-left">
          <h2>Database Management</h2>
          <p>Monitor and manage your Neon PostgreSQL databases</p>
        </div>
        <div className="header-actions">
          <a href="https://console.neon.tech" target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
            <ExternalLink size={16} /> Neon Console
          </a>
          <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
            <ExternalLink size={16} /> Supabase
          </a>
        </div>
      </header>

      {dbStats && (
        <div className="db-stats-grid">
          <div className="stat-card">
            <HardDrive size={24} />
            <div className="stat-value">{dbStats.size}</div>
            <div className="stat-label">Database Size</div>
          </div>
          <div className="stat-card">
            <Database size={24} />
            <div className="stat-value">{dbStats.schemas?.length || 0}</div>
            <div className="stat-label">Schemas</div>
          </div>
          <div className="stat-card">
            <Activity size={24} />
            <div className="stat-value">{dbStats.totalRows?.toLocaleString() || 0}</div>
            <div className="stat-label">Total Rows</div>
          </div>
        </div>
      )}

      <div className="db-section">
        <div className="schema-tabs">
          {dbStats?.schemas?.map(schema => (
            <button key={schema} className={`schema-tab ${selectedSchema === schema ? 'active' : ''}`} onClick={() => loadTables(schema)}>
              {schema} ({dbStats.tablesBySchema?.[schema] || 0})
            </button>
          ))}
        </div>

        <div className="tables-list">
          <table className="data-table">
            <thead>
              <tr>
                <th>Table</th>
                <th>Columns</th>
                <th>Rows</th>
                <th>Size</th>
              </tr>
            </thead>
            <tbody>
              {tables.map(table => (
                <tr key={table.name}>
                  <td><code>{table.name}</code></td>
                  <td>{table.columns}</td>
                  <td>{table.rows?.toLocaleString()}</td>
                  <td>{table.size}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );

  // NAS View
  const renderNASView = () => (
    <>
      <header className="content-header">
        <div className="header-left">
          <h2>Synology NAS</h2>
          <p>Access your network storage from anywhere</p>
        </div>
      </header>

      <div className="nas-cards">
        <div className="nas-card">
          <div className="nas-icon"><Cloud size={32} /></div>
          <h3>QuickConnect</h3>
          <p>Access via Synology QuickConnect (works anywhere)</p>
          <a href="http://QuickConnect.to/advancedmarketing" target="_blank" rel="noopener noreferrer" className="btn btn-primary">
            <ExternalLink size={16} /> Open QuickConnect
          </a>
        </div>

        <div className="nas-card">
          <div className="nas-icon"><Wifi size={32} /></div>
          <h3>Tailscale VPN</h3>
          <p>Secure remote access via Tailscale</p>
          <a href="https://100.122.165.61:5001/" target="_blank" rel="noopener noreferrer" className="btn btn-primary">
            <ExternalLink size={16} /> Open via Tailscale
          </a>
        </div>

        <div className="nas-card">
          <div className="nas-icon"><Home size={32} /></div>
          <h3>Local Network</h3>
          <p>Direct access when on home WiFi</p>
          <a href="http://192.168.1.84:5000" target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
            <ExternalLink size={16} /> Local IP Access
          </a>
        </div>
      </div>

      <div className="nas-info">
        <h3>Connection Details</h3>
        <div className="info-row"><span>QuickConnect ID:</span><code>advancedmarketing</code></div>
        <div className="info-row"><span>Tailscale IP:</span><code>100.122.165.61</code></div>
        <div className="info-row"><span>Local IP:</span><code>192.168.1.84</code></div>
        <div className="info-row"><span>Username:</span><code>Ben</code></div>
      </div>
    </>
  );

  // Settings View
  const renderSettingsView = () => (
    <>
      <header className="content-header">
        <div className="header-left">
          <h2>Settings</h2>
          <p>Configure your hosting manager preferences</p>
        </div>
      </header>

      <div className="settings-container">
        <div className="settings-section">
          <h3>API Configuration</h3>
          <div className="setting-row">
            <div className="setting-info"><strong>Netlify Access Token</strong><p>For site management</p></div>
            <span className="token-status configured">Configured</span>
          </div>
          <div className="setting-row">
            <div className="setting-info"><strong>Cloudflare API Token</strong><p>For DNS management</p></div>
            <span className="token-status configured">Configured</span>
          </div>
          <div className="setting-row">
            <div className="setting-info"><strong>Database Connection</strong><p>Neon PostgreSQL</p></div>
            <span className="token-status configured">Connected</span>
          </div>
        </div>

        <div className="settings-section">
          <h3>Protected Sites ({Object.values(locks).filter(l => l?.locked).length})</h3>
          <div className="protected-sites-list">
            {sites.filter(s => locks[s.id]?.locked).map(site => (
              <div key={site.id} className="protected-site">
                <Lock size={14} />
                <span>{site.name}</span>
                <span className="domain">{site.domain || site.defaultDomain}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-header">
          <Shield size={24} />
          <h1>Hosting Manager</h1>
        </div>

        <nav className="sidebar-nav">
          <button className={`nav-item ${activeView === 'sites' ? 'active' : ''}`} onClick={() => setActiveView('sites')}>
            <Globe size={18} /><span>Netlify Sites</span><span className="badge">{sites.length}</span>
          </button>
          <button className={`nav-item ${activeView === 'github' ? 'active' : ''}`} onClick={() => setActiveView('github')}>
            <GitBranch size={18} /><span>GitHub Repos</span><span className="badge">{repos.length}</span>
          </button>
          <button className={`nav-item ${activeView === 'databases' ? 'active' : ''}`} onClick={() => setActiveView('databases')}>
            <Database size={18} /><span>Databases</span>
          </button>
          <button className={`nav-item ${activeView === 'nas' ? 'active' : ''}`} onClick={() => setActiveView('nas')}>
            <HardDrive size={18} /><span>NAS Storage</span>
          </button>
          <button className={`nav-item ${activeView === 'settings' ? 'active' : ''}`} onClick={() => setActiveView('settings')}>
            <Settings size={18} /><span>Settings</span>
          </button>
        </nav>

        <div className="sidebar-stats">
          <h3>Quick Stats</h3>
          <div className="stat"><Lock size={14} /><span>Locked</span><strong>{Object.values(locks).filter(l => l?.locked).length}</strong></div>
          <div className="stat"><Globe size={14} /><span>With Domain</span><strong>{sites.filter(s => s.domain).length}</strong></div>
        </div>

        <div className="sidebar-user">
          <User size={16} />
          <span>admin@advancedmarketing.co</span>
          <button className="logout-btn" onClick={handleLogout} title="Logout">
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      <main className="main-content">
        {activeView === 'sites' && renderSitesView()}
        {activeView === 'github' && renderGitHubView()}
        {activeView === 'databases' && renderDatabasesView()}
        {activeView === 'nas' && renderNASView()}
        {activeView === 'settings' && renderSettingsView()}
      </main>

      {/* Create Site Modal */}
      {showCreateSite && (
        <div className="modal-overlay" onClick={() => setShowCreateSite(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Create New Site</h2>
            <div className="form-group">
              <label>Site Name</label>
              <input type="text" value={createSiteData.name} onChange={e => setCreateSiteData({ ...createSiteData, name: e.target.value })} placeholder="my-new-site" />
            </div>
            <div className="form-group">
              <label>GitHub Repo URL (optional)</label>
              <input type="text" value={createSiteData.repoUrl} onChange={e => setCreateSiteData({ ...createSiteData, repoUrl: e.target.value })} placeholder="https://github.com/user/repo" />
            </div>
            <div className="form-group">
              <label>Branch</label>
              <input type="text" value={createSiteData.branch} onChange={e => setCreateSiteData({ ...createSiteData, branch: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Build Command</label>
              <input type="text" value={createSiteData.buildCommand} onChange={e => setCreateSiteData({ ...createSiteData, buildCommand: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Publish Directory</label>
              <input type="text" value={createSiteData.publishDir} onChange={e => setCreateSiteData({ ...createSiteData, publishDir: e.target.value })} />
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowCreateSite(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={createSite}>Create Site</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Domain Modal */}
      {showAddDomain && (
        <div className="modal-overlay" onClick={() => setShowAddDomain(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Add Domain</h2>
            <div className="form-group">
              <label>Select Site</label>
              <select value={addDomainData.siteId} onChange={e => setAddDomainData({ ...addDomainData, siteId: e.target.value })}>
                <option value="">Select a site...</option>
                {sites.map(site => (
                  <option key={site.id} value={site.id}>{site.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Domain</label>
              <input type="text" value={addDomainData.domain} onChange={e => setAddDomainData({ ...addDomainData, domain: e.target.value })} placeholder="advancedmarketing.co" />
            </div>
            <div className="form-group">
              <label>Subdomain (optional)</label>
              <input type="text" value={addDomainData.subdomain} onChange={e => setAddDomainData({ ...addDomainData, subdomain: e.target.value })} placeholder="app" />
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowAddDomain(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={addDomain}>Add Domain</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
