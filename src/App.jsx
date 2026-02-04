import { useState, useEffect } from 'react';
import {
  Globe, Database, Lock, Unlock, Shield, AlertTriangle,
  ExternalLink, Search, RefreshCw, Settings,
  Server, GitBranch, Link2, CheckCircle, XCircle,
  ChevronDown, ChevronRight, Star, Clock, Code,
  HardDrive, Activity, Zap, LogOut, User
} from 'lucide-react';
import './App.css';

// Auth credentials (hashed in production, plain for demo)
const AUTH_CREDENTIALS = {
  email: 'admin@advancedmarketing.co',
  password: 'JEsus777$!'
};

// Site configuration with locks and database connections
const SITE_CONFIG = {
  "f44eed07-1f4d-4ecd-8574-f63cc78fccb2": {
    locked: true, category: "core", database: null,
    githubRepo: "bensblueprints/advanced-marketing-main",
    notes: "Main advancedmarketing.co landing page"
  },
  "20a564f4-ab83-432f-a548-ce127ba56d84": {
    locked: true, category: "core", database: null,
    githubRepo: "bensblueprints/web-design-pages",
    notes: "Website landing pages for 15 industries"
  },
  "94004f3c-3d4a-45e7-b371-40f3eec9c629": {
    locked: false, category: "tools", database: "neon:ads-dashboard",
    githubRepo: "bensblueprints/ads-dashboard",
    notes: "Facebook Ads Manager Dashboard with AI Chat"
  },
  "421e1ae8-e39f-4b51-8093-b1e5deed9738": {
    locked: false, category: "tools", database: "neon:leadforge",
    githubRepo: null, notes: "LeadForge SaaS application"
  },
  "a1dd6ea4-5246-440f-a25f-48e4d3df93ea": {
    locked: false, category: "products", database: "neon:invoiceyou",
    githubRepo: null, notes: "Invoice generator tool"
  },
  "37662b2c-326d-4c44-a12e-6595308a8972": {
    locked: false, category: "products", database: "neon:onward-travel",
    githubRepo: null, notes: "Onward Travel Ticket generator"
  },
  "121c5e3d-dcc4-488f-852a-2f5da8b98a3f": {
    locked: false, category: "tools", database: null,
    githubRepo: "bensblueprints/hosting-manager-dashboard",
    notes: "This hosting management dashboard"
  }
};

// Raw site data from Netlify
const RAW_SITES = [
  { name: "ads-dashboard-am", id: "94004f3c-3d4a-45e7-b371-40f3eec9c629", domain: "ads.advancedmarketing.co", url: "https://ads.advancedmarketing.co" },
  { name: "hosting-manager-am", id: "121c5e3d-dcc4-488f-852a-2f5da8b98a3f", domain: "hosting.advancedmarketing.co", url: "https://hosting.advancedmarketing.co" },
  { name: "joyful-bublanina-e23947", id: "fa1184eb-2509-4977-9022-88a37e331dee", domain: "upwork.advancedmarketing.co", url: "https://upwork.advancedmarketing.co" },
  { name: "advanced-marketing-main", id: "f44eed07-1f4d-4ecd-8574-f63cc78fccb2", domain: "advancedmarketing.co", url: "https://advancedmarketing.co" },
  { name: "web-design-pages-am", id: "20a564f4-ab83-432f-a548-ce127ba56d84", domain: "website.advancedmarketing.co", url: "https://website.advancedmarketing.co" },
  { name: "multistream-pro", id: "43df070e-cbb2-416b-8e13-5b2bc20f85c6", domain: null, url: "http://multistream-pro.netlify.app" },
  { name: "playbook-125m-sale", id: "33603036-5bd7-436b-8db5-fe2a2430d499", domain: "playbook.advancedmarketing.co", url: "https://playbook.advancedmarketing.co" },
  { name: "leadforge-saas", id: "421e1ae8-e39f-4b51-8093-b1e5deed9738", domain: "leadforge.advancedmarketing.co", url: "https://leadforge.advancedmarketing.co" },
  { name: "lead-scraper-dashboard", id: "a0774f77-bec6-4db1-b52c-515cdacb04e3", domain: null, url: "http://lead-scraper-dashboard.netlify.app" },
  { name: "malaysia-solar-site", id: "0f222d4b-fc7a-4f68-86e6-a5dacd8e8c9a", domain: null, url: "http://malaysia-solar-site.netlify.app" },
  { name: "bulkkratom-store", id: "c7750b63-7c55-49c4-9094-2515e7dddf6a", domain: "bulkkratom.us", url: "http://bulkkratom.us" },
  { name: "coworkatlas", id: "3c8ed7e1-2abf-4cab-9377-c3449345f251", domain: "coworkingatlas.com", url: "https://coworkingatlas.com" },
  { name: "coffee-class-danang", id: "35aedd8a-b66c-4d7a-a98d-8df8e4a97153", domain: "coffeeclassdanang.com", url: "https://coffeeclassdanang.com" },
  { name: "shopify-branding-blueprint", id: "cc672cf8-bfbf-44e8-958b-ebc9a3ac5ddd", domain: "shopifycourse.advancedmarketing.co", url: "https://shopifycourse.advancedmarketing.co" },
  { name: "foundersvietnam", id: "e2e0169c-6c14-40c1-b1b7-c48624d4ccbb", domain: "foundersvietnam.com", url: "https://foundersvietnam.com" },
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

// GitHub repositories data
const GITHUB_REPOS = [
  { name: "hosting-manager-dashboard", fullName: "bensblueprints/hosting-manager-dashboard", description: "Netlify hosting management dashboard", language: "JavaScript", stars: 0, updatedAt: "2026-02-04", url: "https://github.com/bensblueprints/hosting-manager-dashboard", linkedSite: "hosting-manager-am" },
  { name: "ads-dashboard", fullName: "bensblueprints/ads-dashboard", description: "Facebook Ads Manager Dashboard with AI Chat", language: "JavaScript", stars: 0, updatedAt: "2026-02-04", url: "https://github.com/bensblueprints/ads-dashboard", linkedSite: "ads-dashboard-am" },
  { name: "advanced-marketing-main", fullName: "bensblueprints/advanced-marketing-main", description: "Main landing page for Advanced Marketing", language: "HTML", stars: 0, updatedAt: "2026-01-15", url: "https://github.com/bensblueprints/advanced-marketing-main", linkedSite: "advanced-marketing-main" },
  { name: "web-design-pages", fullName: "bensblueprints/web-design-pages", description: "Industry-specific landing pages", language: "JavaScript", stars: 0, updatedAt: "2026-01-20", url: "https://github.com/bensblueprints/web-design-pages", linkedSite: "web-design-pages-am" },
  { name: "leadforge", fullName: "bensblueprints/leadforge", description: "Lead generation SaaS platform", language: "TypeScript", stars: 2, updatedAt: "2026-01-28", url: "https://github.com/bensblueprints/leadforge", linkedSite: "leadforge-saas" },
  { name: "invoicefree", fullName: "bensblueprints/invoicefree", description: "Free invoice generator", language: "JavaScript", stars: 1, updatedAt: "2026-01-10", url: "https://github.com/bensblueprints/invoicefree", linkedSite: "invoiceyou" },
  { name: "onward-travel", fullName: "bensblueprints/onward-travel", description: "Onward travel ticket generator", language: "JavaScript", stars: 3, updatedAt: "2026-02-01", url: "https://github.com/bensblueprints/onward-travel", linkedSite: "onward-travel-ticket" },
  { name: "coworking-atlas", fullName: "bensblueprints/coworking-atlas", description: "Coworking space directory", language: "JavaScript", stars: 0, updatedAt: "2025-12-15", url: "https://github.com/bensblueprints/coworking-atlas", linkedSite: "coworkatlas" },
  { name: "rootaccess-design", fullName: "bensblueprints/rootaccess-design", description: "Root Access Design agency site", language: "JavaScript", stars: 0, updatedAt: "2026-01-05", url: "https://github.com/bensblueprints/rootaccess-design", linkedSite: "rootaccessdesign" },
  { name: "voicepitch-pro", fullName: "bensblueprints/voicepitch-pro", description: "Voice pitch training app", language: "JavaScript", stars: 1, updatedAt: "2025-11-20", url: "https://github.com/bensblueprints/voicepitch-pro", linkedSite: "voicepitchpro" },
];

// Database connections
const DATABASES = [
  {
    id: "neon-main",
    name: "neondb (Primary)",
    provider: "Neon",
    host: "ep-aged-river-ah63sktg-pooler.us-east-1.aws.neon.tech",
    database: "neondb",
    status: "connected",
    tables: 24,
    size: "156 MB",
    connectedSites: [
      { name: "ads-dashboard-am", schema: "ads_dashboard" },
      { name: "leadforge-saas", schema: "leadforge" },
      { name: "invoiceyou", schema: "invoices" },
      { name: "onward-travel-ticket", schema: "travel" }
    ]
  },
  {
    id: "supabase-main",
    name: "Supabase (Secondary)",
    provider: "Supabase",
    host: "db.supabase.co",
    database: "postgres",
    status: "connected",
    tables: 8,
    size: "42 MB",
    connectedSites: [
      { name: "coworkatlas", schema: "public" },
      { name: "voicepitchpro", schema: "public" }
    ]
  }
];

// Domain registrar info
const DOMAINS = [
  { domain: "advancedmarketing.co", registrar: "Namecheap", dns: "Cloudflare", expires: "2027-01-03", autoRenew: true, ssl: true, site: "advanced-marketing-main" },
  { domain: "rootaccess.design", registrar: "Namecheap", dns: "Netlify", expires: "2026-08-15", autoRenew: true, ssl: true, site: "rootaccessdesign" },
  { domain: "invoicefree.xyz", registrar: "Namecheap", dns: "Netlify", expires: "2026-05-20", autoRenew: true, ssl: true, site: "invoiceyou" },
  { domain: "onwardtravelticket.com", registrar: "Namecheap", dns: "Netlify", expires: "2026-11-10", autoRenew: true, ssl: true, site: "onward-travel-ticket" },
  { domain: "coworkingatlas.com", registrar: "Namecheap", dns: "Cloudflare", expires: "2026-09-01", autoRenew: true, ssl: true, site: "coworkatlas" },
  { domain: "voicepitchpro.com", registrar: "Namecheap", dns: "Netlify", expires: "2026-06-15", autoRenew: true, ssl: true, site: "voicepitchpro" },
  { domain: "fakestatement.com", registrar: "Namecheap", dns: "Netlify", expires: "2026-04-20", autoRenew: true, ssl: true, site: "fakestatement" },
  { domain: "upvotethat.com", registrar: "Namecheap", dns: "Cloudflare", expires: "2026-07-30", autoRenew: true, ssl: true, site: "reddittraffic" },
  { domain: "focusflowapp.xyz", registrar: "Namecheap", dns: "Netlify", expires: "2026-03-10", autoRenew: true, ssl: true, site: "adhdboilerplate" },
  { domain: "coffeeclassdanang.com", registrar: "Namecheap", dns: "Cloudflare", expires: "2026-12-01", autoRenew: true, ssl: true, site: "coffee-class-danang" },
  { domain: "foundersvietnam.com", registrar: "Namecheap", dns: "Cloudflare", expires: "2026-10-15", autoRenew: true, ssl: true, site: "foundersvietnam" },
  { domain: "bulkkratom.us", registrar: "Namecheap", dns: "Cloudflare", expires: "2026-08-20", autoRenew: false, ssl: true, site: "bulkkratom-store" },
];

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [activeView, setActiveView] = useState('sites');
  const [sites, setSites] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedSite, setSelectedSite] = useState(null);
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [locks, setLocks] = useState({});
  const [expandedCategories, setExpandedCategories] = useState({
    core: true, tools: true, products: true, rootaccess: true, other: false
  });

  // Check for existing session
  useEffect(() => {
    const session = localStorage.getItem('hosting-manager-auth');
    if (session === 'authenticated') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    setLoginError('');

    if (loginEmail === AUTH_CREDENTIALS.email && loginPassword === AUTH_CREDENTIALS.password) {
      setIsAuthenticated(true);
      localStorage.setItem('hosting-manager-auth', 'authenticated');
    } else {
      setLoginError('Invalid email or password');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('hosting-manager-auth');
    setLoginEmail('');
    setLoginPassword('');
  };

  useEffect(() => {
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

    const initialLocks = {};
    Object.entries(SITE_CONFIG).forEach(([id, config]) => {
      if (config.locked) initialLocks[id] = true;
    });
    setLocks(initialLocks);
  }, []);

  const toggleLock = (siteId) => {
    setLocks(prev => ({ ...prev, [siteId]: !prev[siteId] }));
  };

  const filteredSites = sites.filter(site => {
    const matchesSearch = search === '' ||
      site.name.toLowerCase().includes(search.toLowerCase()) ||
      (site.domain && site.domain.toLowerCase().includes(search.toLowerCase()));
    const matchesFilter = filter === 'all' ||
      (filter === 'locked' && locks[site.id]) ||
      (filter === 'unlocked' && !locks[site.id]) ||
      (filter === 'with-domain' && site.domain) ||
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
    setExpandedCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  const renderSitesView = () => (
    <>
      <header className="content-header">
        <div className="header-left">
          <h2>Netlify Sites</h2>
          <p>Manage and protect your deployments</p>
        </div>
        <button className="btn btn-secondary"><RefreshCw size={16} /> Refresh</button>
      </header>

      <div className="filters">
        <div className="search-box">
          <Search size={18} />
          <input type="text" placeholder="Search sites or domains..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="filter-buttons">
          {['all', 'locked', 'unlocked', 'with-domain', 'with-db'].map(f => (
            <button key={f} className={`filter-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
              {f === 'locked' && <Lock size={14} />}
              {f === 'unlocked' && <Unlock size={14} />}
              {f === 'with-domain' && <Globe size={14} />}
              {f === 'with-db' && <Database size={14} />}
              {f === 'all' ? 'All' : f === 'locked' ? 'Locked' : f === 'unlocked' ? 'Unlocked' : f === 'with-domain' ? 'Custom Domain' : 'With DB'}
            </button>
          ))}
        </div>
      </div>

      <div className="warning-banner">
        <AlertTriangle size={20} />
        <div>
          <strong>Deployment Protection Active</strong>
          <p>Locked sites cannot be redeployed or have their domains changed.</p>
        </div>
      </div>

      <div className="sites-container">
        {Object.entries(categoryLabels).map(([catKey, catLabel]) => {
          const catSites = filteredSites.filter(s => s.category === catKey);
          if (catSites.length === 0) return null;
          return (
            <div key={catKey} className="category-section">
              <button className="category-header" onClick={() => toggleCategory(catKey)}>
                {expandedCategories[catKey] ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                <span>{catLabel}</span>
                <span className="category-count">{catSites.length}</span>
              </button>
              {expandedCategories[catKey] && (
                <div className="sites-grid">
                  {catSites.map(site => (
                    <div key={site.id} className={`site-card ${locks[site.id] ? 'locked' : ''} ${selectedSite?.id === site.id ? 'selected' : ''}`} onClick={() => setSelectedSite(site)}>
                      <div className="site-card-header">
                        <div className="site-name"><Server size={16} /><span>{site.name}</span></div>
                        <button className={`lock-btn ${locks[site.id] ? 'locked' : ''}`} onClick={(e) => { e.stopPropagation(); toggleLock(site.id); }}>
                          {locks[site.id] ? <Lock size={16} /> : <Unlock size={16} />}
                        </button>
                      </div>
                      <div className="site-domain">
                        {site.domain ? (
                          <a href={site.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>
                            <Globe size={14} />{site.domain}<ExternalLink size={12} />
                          </a>
                        ) : (
                          <span className="no-domain"><Globe size={14} />{site.url.replace(/https?:\/\//, '')}</span>
                        )}
                      </div>
                      <div className="site-meta">
                        {site.database && <span className="meta-tag db"><Database size={12} />{site.database}</span>}
                        {site.githubRepo && <span className="meta-tag github"><GitBranch size={12} />Linked</span>}
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
    </>
  );

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
        {GITHUB_REPOS.map(repo => (
          <div key={repo.name} className={`repo-card ${selectedRepo?.name === repo.name ? 'selected' : ''}`} onClick={() => setSelectedRepo(repo)}>
            <div className="repo-header">
              <GitBranch size={20} className="repo-icon" />
              <div className="repo-name">{repo.name}</div>
            </div>
            <p className="repo-description">{repo.description}</p>
            <div className="repo-meta">
              {repo.language && (
                <span className="repo-language">
                  <span className={`lang-dot ${repo.language.toLowerCase()}`}></span>
                  {repo.language}
                </span>
              )}
              <span className="repo-stars"><Star size={14} /> {repo.stars}</span>
              <span className="repo-updated"><Clock size={14} /> {repo.updatedAt}</span>
            </div>
            {repo.linkedSite && (
              <div className="repo-linked">
                <Link2 size={14} />
                <span>Linked to: {repo.linkedSite}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );

  const renderDatabasesView = () => (
    <>
      <header className="content-header">
        <div className="header-left">
          <h2>Database Connections</h2>
          <p>Monitor your database instances and connections</p>
        </div>
        <div className="header-actions">
          <a href="https://console.neon.tech" target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
            <ExternalLink size={16} /> Neon Console
          </a>
          <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
            <ExternalLink size={16} /> Supabase Dashboard
          </a>
        </div>
      </header>

      <div className="databases-container">
        {DATABASES.map(db => (
          <div key={db.id} className="database-card">
            <div className="db-header">
              <div className="db-title">
                <HardDrive size={24} className="db-icon" />
                <div>
                  <h3>{db.name}</h3>
                  <span className="db-provider">{db.provider}</span>
                </div>
              </div>
              <span className={`db-status ${db.status}`}>
                <Activity size={14} />
                {db.status}
              </span>
            </div>

            <div className="db-info">
              <div className="db-info-row">
                <span>Host</span>
                <code>{db.host}</code>
              </div>
              <div className="db-info-row">
                <span>Database</span>
                <code>{db.database}</code>
              </div>
              <div className="db-info-row">
                <span>Tables</span>
                <strong>{db.tables}</strong>
              </div>
              <div className="db-info-row">
                <span>Size</span>
                <strong>{db.size}</strong>
              </div>
            </div>

            <div className="db-connections">
              <h4>Connected Sites ({db.connectedSites.length})</h4>
              <div className="connected-sites-list">
                {db.connectedSites.map(site => (
                  <div key={site.name} className="connected-site">
                    <Server size={14} />
                    <span className="site-name">{site.name}</span>
                    <code className="schema-name">{site.schema}</code>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="db-warning">
        <AlertTriangle size={20} />
        <div>
          <strong>Database Connection String</strong>
          <p>postgresql://neondb_owner:***@ep-aged-river-ah63sktg-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require</p>
          <small>Connection string is stored in Netlify environment variables for each connected site.</small>
        </div>
      </div>
    </>
  );

  const renderDomainsView = () => (
    <>
      <header className="content-header">
        <div className="header-left">
          <h2>Domain Management</h2>
          <p>Track domain registrations, DNS, and SSL certificates</p>
        </div>
        <a href="https://dash.cloudflare.com" target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
          <ExternalLink size={16} /> Cloudflare Dashboard
        </a>
      </header>

      <div className="domains-table-container">
        <table className="domains-table">
          <thead>
            <tr>
              <th>Domain</th>
              <th>Registrar</th>
              <th>DNS</th>
              <th>Expires</th>
              <th>Auto-Renew</th>
              <th>SSL</th>
              <th>Linked Site</th>
            </tr>
          </thead>
          <tbody>
            {DOMAINS.map(d => (
              <tr key={d.domain}>
                <td className="domain-name">
                  <Globe size={14} />
                  <a href={`https://${d.domain}`} target="_blank" rel="noopener noreferrer">
                    {d.domain}
                  </a>
                </td>
                <td>{d.registrar}</td>
                <td>
                  <span className={`dns-badge ${d.dns.toLowerCase()}`}>{d.dns}</span>
                </td>
                <td className="expires-date">{d.expires}</td>
                <td>
                  {d.autoRenew ? (
                    <CheckCircle size={16} className="icon-success" />
                  ) : (
                    <XCircle size={16} className="icon-warning" />
                  )}
                </td>
                <td>
                  {d.ssl ? (
                    <span className="ssl-active"><Zap size={14} /> Active</span>
                  ) : (
                    <span className="ssl-inactive">Inactive</span>
                  )}
                </td>
                <td>
                  <span className="linked-site-badge">{d.site}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );

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
          <h3>API Tokens</h3>
          <div className="setting-row">
            <div className="setting-info">
              <strong>Netlify Access Token</strong>
              <p>Used for API-based site management</p>
            </div>
            <span className="token-status configured">Configured</span>
          </div>
          <div className="setting-row">
            <div className="setting-info">
              <strong>Cloudflare API Token</strong>
              <p>Used for DNS management</p>
            </div>
            <span className="token-status configured">Configured</span>
          </div>
          <div className="setting-row">
            <div className="setting-info">
              <strong>GitHub Token</strong>
              <p>Used for repository access</p>
            </div>
            <span className="token-status configured">Configured</span>
          </div>
        </div>

        <div className="settings-section">
          <h3>Protected Sites</h3>
          <p className="section-desc">These sites are locked and cannot be redeployed through this dashboard.</p>
          <div className="protected-sites-list">
            {Object.entries(locks).filter(([, locked]) => locked).map(([siteId]) => {
              const site = sites.find(s => s.id === siteId);
              return site ? (
                <div key={siteId} className="protected-site">
                  <Lock size={14} />
                  <span>{site.name}</span>
                  <span className="domain">{site.domain}</span>
                </div>
              ) : null;
            })}
          </div>
        </div>
      </div>
    </>
  );

  // Render login screen if not authenticated
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
            <button type="submit" className="login-btn">Sign In</button>
          </form>
        </div>
      </div>
    );
  }

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
            <GitBranch size={18} /><span>GitHub Repos</span><span className="badge">{GITHUB_REPOS.length}</span>
          </button>
          <button className={`nav-item ${activeView === 'databases' ? 'active' : ''}`} onClick={() => setActiveView('databases')}>
            <Database size={18} /><span>Databases</span><span className="badge">{DATABASES.length}</span>
          </button>
          <button className={`nav-item ${activeView === 'domains' ? 'active' : ''}`} onClick={() => setActiveView('domains')}>
            <Link2 size={18} /><span>Domains</span><span className="badge">{DOMAINS.length}</span>
          </button>
          <button className={`nav-item ${activeView === 'settings' ? 'active' : ''}`} onClick={() => setActiveView('settings')}>
            <Settings size={18} /><span>Settings</span>
          </button>
        </nav>

        <div className="sidebar-stats">
          <h3>Quick Stats</h3>
          <div className="stat"><Lock size={14} /><span>Locked Sites</span><strong>{Object.values(locks).filter(Boolean).length}</strong></div>
          <div className="stat"><Globe size={14} /><span>Custom Domains</span><strong>{sites.filter(s => s.domain).length}</strong></div>
          <div className="stat"><Database size={14} /><span>With Database</span><strong>{sites.filter(s => s.database).length}</strong></div>
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
        {activeView === 'domains' && renderDomainsView()}
        {activeView === 'settings' && renderSettingsView()}

        {selectedSite && activeView === 'sites' && (
          <div className="detail-panel">
            <div className="detail-header">
              <h3>{selectedSite.name}</h3>
              <button className="close-btn" onClick={() => setSelectedSite(null)}>×</button>
            </div>
            <div className="detail-content">
              <div className="detail-section">
                <h4>Site Information</h4>
                <div className="detail-row"><span>Site ID</span><code>{selectedSite.id}</code></div>
                <div className="detail-row"><span>URL</span><a href={selectedSite.url} target="_blank" rel="noopener noreferrer">{selectedSite.url} <ExternalLink size={12} /></a></div>
                <div className="detail-row"><span>Custom Domain</span><span>{selectedSite.domain || 'None'}</span></div>
                <div className="detail-row">
                  <span>Protection</span>
                  <span className={locks[selectedSite.id] ? 'status-locked' : 'status-unlocked'}>
                    {locks[selectedSite.id] ? <><Lock size={14} /> Protected</> : <><Unlock size={14} /> Unprotected</>}
                  </span>
                </div>
              </div>
              {selectedSite.database && (
                <div className="detail-section">
                  <h4>Database</h4>
                  <div className="detail-row"><span>Connection</span><span>{selectedSite.database}</span></div>
                </div>
              )}
              {selectedSite.githubRepo && (
                <div className="detail-section">
                  <h4>GitHub Repository</h4>
                  <div className="detail-row">
                    <span>Repo</span>
                    <a href={`https://github.com/${selectedSite.githubRepo}`} target="_blank" rel="noopener noreferrer">
                      {selectedSite.githubRepo} <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
              )}
              {selectedSite.notes && (
                <div className="detail-section"><h4>Notes</h4><p>{selectedSite.notes}</p></div>
              )}
              <div className="detail-actions">
                <button className={`btn ${locks[selectedSite.id] ? 'btn-danger' : 'btn-primary'}`} onClick={() => toggleLock(selectedSite.id)}>
                  {locks[selectedSite.id] ? <><Unlock size={16} /> Unlock</> : <><Lock size={16} /> Lock</>}
                </button>
                <a href={`https://app.netlify.com/projects/${selectedSite.name}`} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
                  <ExternalLink size={16} /> Netlify
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
