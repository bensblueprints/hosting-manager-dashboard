// Site Management API for Hosting Manager
// Handles creating sites, deploying repos, managing builds

const NETLIFY_API = 'https://api.netlify.com/api/v1';
const GITHUB_API = 'https://api.github.com';

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
  const githubToken = process.env.GITHUB_TOKEN;

  if (!netlifyToken) {
    return respond(500, { error: 'NETLIFY_ACCESS_TOKEN not configured' });
  }

  try {
    const { action, ...data } = JSON.parse(event.body || '{}');

    switch (action) {
      // ============ LIST SITES ============
      case 'list-sites': {
        const response = await fetch(`${NETLIFY_API}/sites?per_page=100`, {
          headers: { 'Authorization': `Bearer ${netlifyToken}` }
        });
        const sites = await response.json();

        return respond(200, {
          sites: sites.map(site => ({
            id: site.site_id || site.id,
            name: site.name,
            url: site.ssl_url || site.url,
            adminUrl: `https://app.netlify.com/sites/${site.name}`,
            domain: site.custom_domain,
            defaultDomain: `${site.name}.netlify.app`,
            repoUrl: site.build_settings?.repo_url,
            branch: site.build_settings?.repo_branch,
            buildCommand: site.build_settings?.cmd,
            publishDir: site.build_settings?.dir,
            createdAt: site.created_at,
            updatedAt: site.updated_at,
            screenshotUrl: site.screenshot_url
          }))
        });
      }

      // ============ GET SITE DETAILS ============
      case 'get-site': {
        const { siteId } = data;
        const response = await fetch(`${NETLIFY_API}/sites/${siteId}`, {
          headers: { 'Authorization': `Bearer ${netlifyToken}` }
        });
        const site = await response.json();

        // Get recent deploys
        const deploysResponse = await fetch(`${NETLIFY_API}/sites/${siteId}/deploys?per_page=5`, {
          headers: { 'Authorization': `Bearer ${netlifyToken}` }
        });
        const deploys = await deploysResponse.json();

        return respond(200, { site, deploys });
      }

      // ============ CREATE NEW SITE ============
      case 'create-site': {
        const { name, repoUrl, branch = 'main', buildCommand, publishDir = 'dist' } = data;

        const siteData = { name };

        // If repo provided, set up continuous deployment
        if (repoUrl) {
          // Parse repo URL to get owner/repo
          const repoMatch = repoUrl.match(/github\.com[\/:]([^\/]+)\/([^\/\.]+)/);
          if (repoMatch) {
            siteData.repo = {
              provider: 'github',
              repo: `${repoMatch[1]}/${repoMatch[2]}`,
              branch,
              cmd: buildCommand || 'npm run build',
              dir: publishDir
            };
          }
        }

        const response = await fetch(`${NETLIFY_API}/sites`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${netlifyToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(siteData)
        });

        const site = await response.json();

        if (!response.ok) {
          return respond(response.status, { error: site.message || 'Failed to create site' });
        }

        return respond(200, {
          success: true,
          site: {
            id: site.site_id || site.id,
            name: site.name,
            url: site.ssl_url || site.url,
            adminUrl: `https://app.netlify.com/sites/${site.name}`
          }
        });
      }

      // ============ DELETE SITE ============
      case 'delete-site': {
        const { siteId } = data;

        const response = await fetch(`${NETLIFY_API}/sites/${siteId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${netlifyToken}` }
        });

        if (!response.ok && response.status !== 204) {
          const error = await response.json();
          return respond(response.status, { error: error.message || 'Failed to delete site' });
        }

        return respond(200, { success: true, siteId });
      }

      // ============ TRIGGER DEPLOY ============
      case 'trigger-deploy': {
        const { siteId, clearCache = false } = data;

        const response = await fetch(`${NETLIFY_API}/sites/${siteId}/builds`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${netlifyToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ clear_cache: clearCache })
        });

        const build = await response.json();

        if (!response.ok) {
          return respond(response.status, { error: build.message || 'Failed to trigger deploy' });
        }

        return respond(200, { success: true, build });
      }

      // ============ LIST GITHUB REPOS ============
      case 'list-github-repos': {
        if (!githubToken) {
          return respond(500, { error: 'GITHUB_TOKEN not configured' });
        }

        const response = await fetch(`${GITHUB_API}/user/repos?per_page=100&sort=updated`, {
          headers: {
            'Authorization': `token ${githubToken}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        });
        const repos = await response.json();

        return respond(200, {
          repos: repos.map(repo => ({
            id: repo.id,
            name: repo.name,
            fullName: repo.full_name,
            description: repo.description,
            url: repo.html_url,
            cloneUrl: repo.clone_url,
            language: repo.language,
            stars: repo.stargazers_count,
            forks: repo.forks_count,
            defaultBranch: repo.default_branch,
            updatedAt: repo.updated_at,
            private: repo.private
          }))
        });
      }

      // ============ CREATE GITHUB REPO ============
      case 'create-github-repo': {
        if (!githubToken) {
          return respond(500, { error: 'GITHUB_TOKEN not configured' });
        }

        const { name, description, isPrivate = false } = data;

        const response = await fetch(`${GITHUB_API}/user/repos`, {
          method: 'POST',
          headers: {
            'Authorization': `token ${githubToken}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name,
            description,
            private: isPrivate,
            auto_init: true
          })
        });

        const repo = await response.json();

        if (!response.ok) {
          return respond(response.status, { error: repo.message || 'Failed to create repo' });
        }

        return respond(200, {
          success: true,
          repo: {
            id: repo.id,
            name: repo.name,
            fullName: repo.full_name,
            url: repo.html_url,
            cloneUrl: repo.clone_url
          }
        });
      }

      // ============ LINK REPO TO SITE ============
      case 'link-repo-to-site': {
        const { siteId, repoFullName, branch = 'main', buildCommand = 'npm run build', publishDir = 'dist' } = data;

        const response = await fetch(`${NETLIFY_API}/sites/${siteId}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${netlifyToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            repo: {
              provider: 'github',
              repo: repoFullName,
              branch,
              cmd: buildCommand,
              dir: publishDir
            }
          })
        });

        const site = await response.json();

        if (!response.ok) {
          return respond(response.status, { error: site.message || 'Failed to link repo' });
        }

        return respond(200, { success: true, site });
      }

      // ============ GET DEPLOY LOGS ============
      case 'get-deploy-logs': {
        const { deployId } = data;

        const response = await fetch(`${NETLIFY_API}/deploys/${deployId}`, {
          headers: { 'Authorization': `Bearer ${netlifyToken}` }
        });
        const deploy = await response.json();

        return respond(200, { deploy });
      }

      default:
        return respond(400, { error: 'Invalid action' });
    }
  } catch (error) {
    console.error('Site Management Error:', error);
    return respond(500, { error: error.message });
  }
};

function respond(statusCode, body) {
  return { statusCode, headers: CORS_HEADERS, body: JSON.stringify(body) };
}
