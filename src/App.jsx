import { useState, useEffect } from 'react';
import {
  Globe, Database, Lock, Unlock, Shield, AlertTriangle,
  ExternalLink, Search, Filter, RefreshCw, Settings,
  Server, GitBranch, Link2, CheckCircle, XCircle,
  ChevronDown, ChevronRight, Trash2, Eye
} from 'lucide-react';
import './App.css';

// Site configuration with locks and database connections
const SITE_CONFIG = {
  // Core sites - LOCKED (never allow redeploy)
  "f44eed07-1f4d-4ecd-8574-f63cc78fccb2": {
    locked: true,
    category: "core",
    database: null,
    githubRepo: "bensblueprints/advanced-marketing-main",
    notes: "Main advancedmarketing.co landing page"
  },
  "20a564f4-ab83-432f-a548-ce127ba56d84": {
    locked: true,
    category: "core",
    database: null,
    githubRepo: "bensblueprints/web-design-pages",
    notes: "Website landing pages for 15 industries"
  },
  "94004f3c-3d4a-45e7-b371-40f3eec9c629": {
    locked: false,
    category: "tools",
    database: "neon:ads-dashboard",
    githubRepo: null,
    notes: "Facebook Ads Manager Dashboard with AI Chat"
  },
  "421e1ae8-e39f-4b51-8093-b1e5deed9738": {
    locked: false,
    category: "tools",
    database: "neon:leadforge",
    githubRepo: null,
    notes: "LeadForge SaaS application"
  },
  "a1dd6ea4-5246-440f-a25f-48e4d3df93ea": {
    locked: false,
    category: "products",
    database: "neon:invoiceyou",
    githubRepo: null,
    notes: "Invoice generator tool"
  },
  "3c8ed7e1-2abf-4cab-9377-c3449345f251": {
    locked: false,
    category: "products",
    database: null,
    githubRepo: null,
    notes: "Coworking Atlas directory"
  },
  "37662b2c-326d-4c44-a12e-6595308a8972": {
    locked: false,
    category: "products",
    database: "neon:onward-travel",
    githubRepo: null,
    notes: "Onward Travel Ticket generator"
  }
};

// Raw site data from Netlify
const RAW_SITES = [
  { name: "ads-dashboard-am", id: "94004f3c-3d4a-45e7-b371-40f3eec9c629", domain: "ads.advancedmarketing.co", url: "https://ads.advancedmarketing.co" },
  { name: "joyful-bublanina-e23947", id: "fa1184eb-2509-4977-9022-88a37e331dee", domain: "upwork.advancedmarketing.co", url: "https://upwork.advancedmarketing.co" },
  { name: "advanced-marketing-main", id: "f44eed07-1f4d-4ecd-8574-f63cc78fccb2", domain: "advancedmarketing.co", url: "http://advancedmarketing.co" },
  { name: "web-design-pages-am", id: "20a564f4-ab83-432f-a548-ce127ba56d84", domain: "website.advancedmarketing.co", url: "https://website.advancedmarketing.co" },
  { name: "multistream-pro", id: "43df070e-cbb2-416b-8e13-5b2bc20f85c6", domain: null, url: "http://multistream-pro.netlify.app" },
  { name: "playbook-125m-sale", id: "33603036-5bd7-436b-8db5-fe2a2430d499", domain: "playbook.advancedmarketing.co", url: "https://playbook.advancedmarketing.co" },
  { name: "leadforge-saas", id: "421e1ae8-e39f-4b51-8093-b1e5deed9738", domain: "leadforge.advancedmarketing.co", url: "https://leadforge.advancedmarketing.co" },
  { name: "lead-scraper-dashboard", id: "a0774f77-bec6-4db1-b52c-515cdacb04e3", domain: null, url: "http://lead-scraper-dashboard.netlify.app" },
  { name: "malaysia-solar-site", id: "0f222d4b-fc7a-4f68-86e6-a5dacd8e8c9a", domain: null, url: "http://malaysia-solar-site.netlify.app" },
  { name: "wp-ai-deploy", id: "21272129-7d0f-4d1e-915c-8c3932d1f817", domain: null, url: "http://wp-ai-deploy.netlify.app" },
  { name: "bulkkratom-store", id: "c7750b63-7c55-49c4-9094-2515e7dddf6a", domain: "bulkkratom.us", url: "http://bulkkratom.us" },
  { name: "bens-web-design-studio", id: "2478f8ad-3b90-44eb-8089-d27357e3a69d", domain: null, url: "https://bens-web-design-studio.netlify.app" },
  { name: "coworkatlas", id: "3c8ed7e1-2abf-4cab-9377-c3449345f251", domain: "coworkingatlas.com", url: "https://coworkingatlas.com" },
  { name: "roofing-atlanta-ga", id: "6d12a337-239f-4c60-ada0-7ce40c0f4ed2", domain: null, url: "http://roofing-atlanta-ga.netlify.app" },
  { name: "coffee-class-danang", id: "35aedd8a-b66c-4d7a-a98d-8df8e4a97153", domain: "coffeeclassdanang.com", url: "https://coffeeclassdanang.com" },
  { name: "shopify-branding-blueprint", id: "cc672cf8-bfbf-44e8-958b-ebc9a3ac5ddd", domain: "shopifycourse.advancedmarketing.co", url: "https://shopifycourse.advancedmarketing.co" },
  { name: "foundersvietnam", id: "e2e0169c-6c14-40c1-b1b7-c48624d4ccbb", domain: "foundersvietnam.com", url: "https://foundersvietnam.com" },
  { name: "psyspeak", id: "32233818-6762-428e-a481-41772c7d1c22", domain: null, url: "https://psyspeak.netlify.app" },
  { name: "shopifyadvancedmarketing", id: "5a19de81-be4f-45ee-8b76-519c8ccb2850", domain: "shopify.advancedmarketing.co", url: "http://shopify.advancedmarketing.co" },
  { name: "invoiceyou", id: "a1dd6ea4-5246-440f-a25f-48e4d3df93ea", domain: "invoicefree.xyz", url: "https://invoicefree.xyz" },
  { name: "voicepitchpro", id: "cbb724f1-39bb-477f-969c-57f9f1e3acae", domain: "voicepitchpro.com", url: "https://voicepitchpro.com" },
  { name: "fakestatement", id: "f38e361f-0941-44fe-9ebb-09335d65f972", domain: "fakestatement.com", url: "https://fakestatement.com" },
  { name: "onward-travel-ticket", id: "37662b2c-326d-4c44-a12e-6595308a8972", domain: "onwardtravelticket.com", url: "https://onwardtravelticket.com" },
  { name: "reddittraffic", id: "1cf5150b-0550-4df9-bacc-121ac2846da7", domain: "www.upvotethat.com", url: "https://www.upvotethat.com" },
  { name: "gentle-banoffee-428f5b", id: "8ccfa948-d78e-4156-b7aa-ace4d91746ed", domain: "start.rootaccess.design", url: "https://start.rootaccess.design" },
  { name: "rootaccessdesign", id: "a1afd84e-91b8-496e-a042-495da04abf80", domain: "www.rootaccess.design", url: "https://www.rootaccess.design" },
  { name: "root-access-site", id: "8e71d816-fc95-4c16-8563-ed97571ac437", domain: "lp.rootaccess.design", url: "https://lp.rootaccess.design" },
  { name: "adhdboilerplate", id: "b3a1b577-8626-4453-9ac4-16b24d9c7142", domain: "focusflowapp.xyz", url: "https://focusflowapp.xyz" },
];

// Database connections
const DATABASES = [
  {
    name: "neondb (Main)",
    host: "ep-aged-river-ah63sktg-pooler.us-east-1.aws.neon.tech",
    connectedSites: ["ads-dashboard-am", "leadforge-saas", "invoiceyou", "onward-travel-ticket"],
    status: "connected"
  }
];

function App() {
  const [sites, setSites] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedSite, setSelectedSite] = useState(null);
  const [locks, setLocks] = useState({});
  const [expandedCategories, setExpandedCategories] = useState({
    core: true,
    tools: true,
    products: true,
    rootaccess: true,
    other: false
  });

  useEffect(() => {
    // Initialize sites with config
    const enrichedSites = RAW_SITES.map(site => {
      const config = SITE_CONFIG[site.id] || {};
      return {
        ...site,
        locked: config.locked || false,
        category: config.category || (site.domain?.includes('advancedmarketing') ? 'core' :
                  site.domain?.includes('rootaccess') ? 'rootaccess' : 'other'),
        database: config.database || null,
        githubRepo: config.githubRepo || null,
        notes: config.notes || null
      };
    });
    setSites(enrichedSites);

    // Initialize locks from config
    const initialLocks = {};
    Object.entries(SITE_CONFIG).forEach(([id, config]) => {
      if (config.locked) initialLocks[id] = true;
    });
    setLocks(initialLocks);
  }, []);

  const toggleLock = (siteId) => {
    setLocks(prev => ({
      ...prev,
      [siteId]: !prev[siteId]
    }));
  };

  const categorizedSites = sites.reduce((acc, site) => {
    const cat = site.category || 'other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(site);
    return acc;
  }, {});

  const filteredSites = sites.filter(site => {
    const matchesSearch = search === '' ||
      site.name.toLowerCase().includes(search.toLowerCase()) ||
      (site.domain && site.domain.toLowerCase().includes(search.toLowerCase()));

    const matchesFilter = filter === 'all' ||
      (filter === 'locked' && locks[site.id]) ||
      (filter === 'unlocked' && !locks[site.id]) ||
      (filter === 'with-domain' && site.domain) ||
      (filter === 'no-domain' && !site.domain) ||
      (filter === 'with-db' && site.database);

    return matchesSearch && matchesFilter;
  });

  const categoryLabels = {
    core: 'Core Sites (Advanced Marketing)',
    tools: 'Tools & Dashboards',
    products: 'Products & SaaS',
    rootaccess: 'Root Access Design',
    other: 'Other Sites'
  };

  const toggleCategory = (cat) => {
    setExpandedCategories(prev => ({
      ...prev,
      [cat]: !prev[cat]
    }));
  };

  return (
    <div className="app">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <Shield size={24} />
          <h1>Hosting Manager</h1>
        </div>

        <nav className="sidebar-nav">
          <button className="nav-item active">
            <Globe size={18} />
            <span>Netlify Sites</span>
            <span className="badge">{sites.length}</span>
          </button>
          <button className="nav-item">
            <GitBranch size={18} />
            <span>GitHub Repos</span>
          </button>
          <button className="nav-item">
            <Database size={18} />
            <span>Databases</span>
          </button>
          <button className="nav-item">
            <Link2 size={18} />
            <span>Domains</span>
          </button>
          <button className="nav-item">
            <Settings size={18} />
            <span>Settings</span>
          </button>
        </nav>

        <div className="sidebar-stats">
          <h3>Quick Stats</h3>
          <div className="stat">
            <Lock size={14} />
            <span>Locked Sites</span>
            <strong>{Object.values(locks).filter(Boolean).length}</strong>
          </div>
          <div className="stat">
            <Globe size={14} />
            <span>Custom Domains</span>
            <strong>{sites.filter(s => s.domain).length}</strong>
          </div>
          <div className="stat">
            <Database size={14} />
            <span>With Database</span>
            <strong>{sites.filter(s => s.database).length}</strong>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Header */}
        <header className="content-header">
          <div className="header-left">
            <h2>Netlify Sites</h2>
            <p>Manage and protect your deployments</p>
          </div>
          <div className="header-actions">
            <button className="btn btn-secondary">
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>
        </header>

        {/* Filters */}
        <div className="filters">
          <div className="search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search sites or domains..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="filter-buttons">
            <button
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button
              className={`filter-btn ${filter === 'locked' ? 'active' : ''}`}
              onClick={() => setFilter('locked')}
            >
              <Lock size={14} /> Locked
            </button>
            <button
              className={`filter-btn ${filter === 'unlocked' ? 'active' : ''}`}
              onClick={() => setFilter('unlocked')}
            >
              <Unlock size={14} /> Unlocked
            </button>
            <button
              className={`filter-btn ${filter === 'with-domain' ? 'active' : ''}`}
              onClick={() => setFilter('with-domain')}
            >
              <Globe size={14} /> Custom Domain
            </button>
            <button
              className={`filter-btn ${filter === 'with-db' ? 'active' : ''}`}
              onClick={() => setFilter('with-db')}
            >
              <Database size={14} /> With DB
            </button>
          </div>
        </div>

        {/* Warning Banner */}
        <div className="warning-banner">
          <AlertTriangle size={20} />
          <div>
            <strong>Deployment Protection Active</strong>
            <p>Locked sites cannot be redeployed or have their domains changed. This prevents accidental overwrites.</p>
          </div>
        </div>

        {/* Sites List */}
        <div className="sites-container">
          {Object.entries(categoryLabels).map(([catKey, catLabel]) => {
            const catSites = filteredSites.filter(s => s.category === catKey);
            if (catSites.length === 0) return null;

            return (
              <div key={catKey} className="category-section">
                <button
                  className="category-header"
                  onClick={() => toggleCategory(catKey)}
                >
                  {expandedCategories[catKey] ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  <span>{catLabel}</span>
                  <span className="category-count">{catSites.length}</span>
                </button>

                {expandedCategories[catKey] && (
                  <div className="sites-grid">
                    {catSites.map(site => (
                      <div
                        key={site.id}
                        className={`site-card ${locks[site.id] ? 'locked' : ''} ${selectedSite?.id === site.id ? 'selected' : ''}`}
                        onClick={() => setSelectedSite(site)}
                      >
                        <div className="site-card-header">
                          <div className="site-name">
                            <Server size={16} />
                            <span>{site.name}</span>
                          </div>
                          <button
                            className={`lock-btn ${locks[site.id] ? 'locked' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleLock(site.id);
                            }}
                            title={locks[site.id] ? 'Click to unlock' : 'Click to lock'}
                          >
                            {locks[site.id] ? <Lock size={16} /> : <Unlock size={16} />}
                          </button>
                        </div>

                        <div className="site-domain">
                          {site.domain ? (
                            <a href={site.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>
                              <Globe size={14} />
                              {site.domain}
                              <ExternalLink size={12} />
                            </a>
                          ) : (
                            <span className="no-domain">
                              <Globe size={14} />
                              {site.url.replace('http://', '').replace('https://', '')}
                            </span>
                          )}
                        </div>

                        <div className="site-meta">
                          {site.database && (
                            <span className="meta-tag db">
                              <Database size={12} />
                              {site.database}
                            </span>
                          )}
                          {site.githubRepo && (
                            <span className="meta-tag github">
                              <GitBranch size={12} />
                              Linked
                            </span>
                          )}
                        </div>

                        <div className="site-id">
                          <code>{site.id.substring(0, 8)}...</code>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Site Detail Panel */}
        {selectedSite && (
          <div className="detail-panel">
            <div className="detail-header">
              <h3>{selectedSite.name}</h3>
              <button className="close-btn" onClick={() => setSelectedSite(null)}>×</button>
            </div>

            <div className="detail-content">
              <div className="detail-section">
                <h4>Site Information</h4>
                <div className="detail-row">
                  <span>Site ID</span>
                  <code>{selectedSite.id}</code>
                </div>
                <div className="detail-row">
                  <span>URL</span>
                  <a href={selectedSite.url} target="_blank" rel="noopener noreferrer">
                    {selectedSite.url} <ExternalLink size={12} />
                  </a>
                </div>
                <div className="detail-row">
                  <span>Custom Domain</span>
                  <span>{selectedSite.domain || 'None'}</span>
                </div>
                <div className="detail-row">
                  <span>Protection Status</span>
                  <span className={locks[selectedSite.id] ? 'status-locked' : 'status-unlocked'}>
                    {locks[selectedSite.id] ? (
                      <><Lock size={14} /> Protected</>
                    ) : (
                      <><Unlock size={14} /> Unprotected</>
                    )}
                  </span>
                </div>
              </div>

              {selectedSite.database && (
                <div className="detail-section">
                  <h4>Database Connection</h4>
                  <div className="detail-row">
                    <span>Database</span>
                    <span>{selectedSite.database}</span>
                  </div>
                  <div className="detail-row">
                    <span>Host</span>
                    <code>ep-aged-river-ah63sktg-pooler.us-east-1.aws.neon.tech</code>
                  </div>
                </div>
              )}

              {selectedSite.notes && (
                <div className="detail-section">
                  <h4>Notes</h4>
                  <p>{selectedSite.notes}</p>
                </div>
              )}

              <div className="detail-actions">
                <button
                  className={`btn ${locks[selectedSite.id] ? 'btn-danger' : 'btn-primary'}`}
                  onClick={() => toggleLock(selectedSite.id)}
                >
                  {locks[selectedSite.id] ? (
                    <><Unlock size={16} /> Unlock Site</>
                  ) : (
                    <><Lock size={16} /> Lock Site</>
                  )}
                </button>
                <a
                  href={`https://app.netlify.com/projects/${selectedSite.name}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary"
                >
                  <ExternalLink size={16} /> Open in Netlify
                </a>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
