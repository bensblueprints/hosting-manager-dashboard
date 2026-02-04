// Netlify Site & Domain Management API
// Requires NETLIFY_ACCESS_TOKEN environment variable

const NETLIFY_API = 'https://api.netlify.com/api/v1';
const CF_API = 'https://api.cloudflare.com/client/v4';

// Cloudflare zone IDs for domains
const CF_ZONES = {
  'advancedmarketing.co': '336d95bd4610e03e5ad636bbe98fe786',
  'upvotethat.com': '24d24f3bc6d8624a89b374f34b7fff2f'
};

// Site lock configuration - prevents deployment overwrites
const LOCKED_SITES = {
  'f44eed07-1f4d-4ecd-8574-f63cc78fccb2': 'advancedmarketing.co - Main landing',
  '20a564f4-ab83-432f-a548-ce127ba56d84': 'website.advancedmarketing.co - Industry pages'
};

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers };
  }

  const netlifyToken = process.env.NETLIFY_ACCESS_TOKEN;
  const cfToken = process.env.CLOUDFLARE_API_TOKEN;

  if (!netlifyToken) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'NETLIFY_ACCESS_TOKEN not configured' })
    };
  }

  try {
    const { action, siteId, domain, subdomain } = JSON.parse(event.body || '{}');

    switch (action) {
      case 'list-sites':
        return await listSites(netlifyToken, headers);

      case 'get-site':
        return await getSite(netlifyToken, siteId, headers);

      case 'add-domain':
        // Check if site is locked
        if (LOCKED_SITES[siteId]) {
          return {
            statusCode: 403,
            headers,
            body: JSON.stringify({
              error: 'Site is locked',
              reason: LOCKED_SITES[siteId]
            })
          };
        }
        return await addDomain(netlifyToken, cfToken, siteId, domain, subdomain, headers);

      case 'check-lock':
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            locked: !!LOCKED_SITES[siteId],
            reason: LOCKED_SITES[siteId] || null
          })
        };

      case 'get-locks':
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ lockedSites: LOCKED_SITES })
        };

      default:
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Invalid action' })
        };
    }
  } catch (error) {
    console.error('API Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};

async function listSites(token, headers) {
  const response = await fetch(`${NETLIFY_API}/sites`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  const sites = await response.json();

  // Enrich with lock status
  const enrichedSites = sites.map(site => ({
    id: site.site_id || site.id,
    name: site.name,
    url: site.ssl_url || site.url,
    domain: site.custom_domain,
    locked: !!LOCKED_SITES[site.site_id || site.id],
    lockReason: LOCKED_SITES[site.site_id || site.id] || null
  }));

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ sites: enrichedSites })
  };
}

async function getSite(token, siteId, headers) {
  const response = await fetch(`${NETLIFY_API}/sites/${siteId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  const site = await response.json();

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      ...site,
      locked: !!LOCKED_SITES[siteId],
      lockReason: LOCKED_SITES[siteId] || null
    })
  };
}

async function addDomain(netlifyToken, cfToken, siteId, domain, subdomain, headers) {
  // First, add domain to Netlify site
  const fullDomain = subdomain ? `${subdomain}.${domain}` : domain;

  const netlifyResponse = await fetch(`${NETLIFY_API}/sites/${siteId}/domains`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${netlifyToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ hostname: fullDomain })
  });

  if (!netlifyResponse.ok) {
    const error = await netlifyResponse.json();
    return {
      statusCode: netlifyResponse.status,
      headers,
      body: JSON.stringify({ error: error.message || 'Failed to add domain to Netlify' })
    };
  }

  // Get the Netlify site name for CNAME target
  const siteResponse = await fetch(`${NETLIFY_API}/sites/${siteId}`, {
    headers: { 'Authorization': `Bearer ${netlifyToken}` }
  });
  const site = await siteResponse.json();
  const cnameTarget = `${site.name}.netlify.app`;

  // If Cloudflare token provided and domain is in our zones, add DNS record
  if (cfToken && CF_ZONES[domain]) {
    const cfResponse = await fetch(`${CF_API}/zones/${CF_ZONES[domain]}/dns_records`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cfToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'CNAME',
        name: subdomain || '@',
        content: cnameTarget,
        ttl: 1,
        proxied: false
      })
    });

    const cfResult = await cfResponse.json();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        domain: fullDomain,
        cnameTarget,
        dnsAdded: cfResult.success,
        message: `Domain ${fullDomain} added. DNS CNAME pointing to ${cnameTarget}`
      })
    };
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      success: true,
      domain: fullDomain,
      cnameTarget,
      dnsAdded: false,
      message: `Domain ${fullDomain} added to Netlify. Please add CNAME record: ${subdomain || '@'} -> ${cnameTarget}`
    })
  };
}
