// Domain Management API for Hosting Manager
// Handles adding domains to sites and managing DNS via Cloudflare

const NETLIFY_API = 'https://api.netlify.com/api/v1';
const CF_API = 'https://api.cloudflare.com/client/v4';

// Known Cloudflare zone IDs
const CF_ZONES = {
  'advancedmarketing.co': '336d95bd4610e03e5ad636bbe98fe786',
  'upvotethat.com': '24d24f3bc6d8624a89b374f34b7fff2f'
};

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Content-Type': 'application/json'
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS };
  }

  const netlifyToken = process.env.NETLIFY_ACCESS_TOKEN;
  const cfToken = process.env.CLOUDFLARE_API_TOKEN;

  try {
    const { action, ...data } = JSON.parse(event.body || '{}');

    switch (action) {
      // ============ LIST SITE DOMAINS ============
      case 'list-site-domains': {
        const { siteId } = data;

        const response = await fetch(`${NETLIFY_API}/sites/${siteId}`, {
          headers: { 'Authorization': `Bearer ${netlifyToken}` }
        });
        const site = await response.json();

        return respond(200, {
          siteName: site.name,
          defaultDomain: `${site.name}.netlify.app`,
          customDomain: site.custom_domain,
          domainAliases: site.domain_aliases || [],
          ssl: site.ssl,
          forceSsl: site.force_ssl
        });
      }

      // ============ ADD DOMAIN TO SITE ============
      case 'add-domain': {
        const { siteId, domain, subdomain, addDnsRecord = true } = data;

        const fullDomain = subdomain ? `${subdomain}.${domain}` : domain;

        // Add domain to Netlify
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
          return respond(netlifyResponse.status, { error: error.message || 'Failed to add domain to Netlify' });
        }

        // Get site name for CNAME target
        const siteResponse = await fetch(`${NETLIFY_API}/sites/${siteId}`, {
          headers: { 'Authorization': `Bearer ${netlifyToken}` }
        });
        const site = await siteResponse.json();
        const cnameTarget = `${site.name}.netlify.app`;

        let dnsResult = null;

        // Add Cloudflare DNS record if requested and domain is in our zones
        if (addDnsRecord && cfToken && CF_ZONES[domain]) {
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
          dnsResult = await cfResponse.json();
        }

        return respond(200, {
          success: true,
          domain: fullDomain,
          cnameTarget,
          dnsAdded: dnsResult?.success || false,
          message: dnsResult?.success
            ? `Domain ${fullDomain} added with DNS record pointing to ${cnameTarget}`
            : `Domain ${fullDomain} added. Please add CNAME: ${subdomain || '@'} -> ${cnameTarget}`
        });
      }

      // ============ REMOVE DOMAIN FROM SITE ============
      case 'remove-domain': {
        const { siteId, domain } = data;

        const response = await fetch(`${NETLIFY_API}/sites/${siteId}/domains/${domain}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${netlifyToken}` }
        });

        if (!response.ok && response.status !== 204) {
          const error = await response.json();
          return respond(response.status, { error: error.message || 'Failed to remove domain' });
        }

        return respond(200, { success: true, domain });
      }

      // ============ LIST CLOUDFLARE ZONES ============
      case 'list-cf-zones': {
        if (!cfToken) {
          return respond(500, { error: 'CLOUDFLARE_API_TOKEN not configured' });
        }

        const response = await fetch(`${CF_API}/zones`, {
          headers: { 'Authorization': `Bearer ${cfToken}` }
        });
        const result = await response.json();

        return respond(200, {
          zones: result.result?.map(zone => ({
            id: zone.id,
            name: zone.name,
            status: zone.status,
            nameServers: zone.name_servers
          })) || []
        });
      }

      // ============ LIST DNS RECORDS ============
      case 'list-dns-records': {
        if (!cfToken) {
          return respond(500, { error: 'CLOUDFLARE_API_TOKEN not configured' });
        }

        const { zoneId } = data;

        const response = await fetch(`${CF_API}/zones/${zoneId}/dns_records?per_page=100`, {
          headers: { 'Authorization': `Bearer ${cfToken}` }
        });
        const result = await response.json();

        return respond(200, {
          records: result.result?.map(record => ({
            id: record.id,
            type: record.type,
            name: record.name,
            content: record.content,
            proxied: record.proxied,
            ttl: record.ttl
          })) || []
        });
      }

      // ============ ADD DNS RECORD ============
      case 'add-dns-record': {
        if (!cfToken) {
          return respond(500, { error: 'CLOUDFLARE_API_TOKEN not configured' });
        }

        const { zoneId, type, name, content, proxied = false, ttl = 1 } = data;

        const response = await fetch(`${CF_API}/zones/${zoneId}/dns_records`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${cfToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ type, name, content, proxied, ttl })
        });

        const result = await response.json();

        if (!result.success) {
          return respond(400, { error: result.errors?.[0]?.message || 'Failed to add DNS record' });
        }

        return respond(200, { success: true, record: result.result });
      }

      // ============ DELETE DNS RECORD ============
      case 'delete-dns-record': {
        if (!cfToken) {
          return respond(500, { error: 'CLOUDFLARE_API_TOKEN not configured' });
        }

        const { zoneId, recordId } = data;

        const response = await fetch(`${CF_API}/zones/${zoneId}/dns_records/${recordId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${cfToken}` }
        });

        const result = await response.json();

        if (!result.success) {
          return respond(400, { error: result.errors?.[0]?.message || 'Failed to delete DNS record' });
        }

        return respond(200, { success: true });
      }

      default:
        return respond(400, { error: 'Invalid action' });
    }
  } catch (error) {
    console.error('Domain Management Error:', error);
    return respond(500, { error: error.message });
  }
};

function respond(statusCode, body) {
  return { statusCode, headers: CORS_HEADERS, body: JSON.stringify(body) };
}
