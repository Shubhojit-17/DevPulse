const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Test GitHub API directly to see if repos actually have PRs
const https = require('https');

function githubGet(path, token) {
  return new Promise((resolve, reject) => {
    https.get({
      hostname: 'api.github.com',
      path,
      headers: {
        'User-Agent': 'DevPulse',
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json'
      }
    }, (res) => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch(e) {
          resolve({ status: res.statusCode, data });
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  const user = await prisma.user.findFirst();
  if (!user || !user.accessToken) {
    console.log('No user or access token found');
    return;
  }
  console.log('User:', user.login, 'Token starts with:', user.accessToken.substring(0, 10) + '...');

  const repos = ['Shubhojit-17/Health-KAave', 'Shubhojit-17/DevPulse', 'Shubhojit-17/Portfolio', 'Shubhojit-17/OnyxProtocol'];

  for (const repo of repos) {
    // Check PRs
    const prResult = await githubGet(`/repos/${repo}/pulls?state=all&per_page=5`, user.accessToken);
    console.log(`\n${repo}:`);
    console.log(`  PRs API status: ${prResult.status}, count: ${Array.isArray(prResult.data) ? prResult.data.length : 'N/A'}`);
    if (Array.isArray(prResult.data) && prResult.data.length > 0) {
      for (const pr of prResult.data.slice(0, 3)) {
        console.log(`    PR #${pr.number}: "${pr.title}" state=${pr.state} merged=${pr.merged_at ? 'yes' : 'no'} created=${pr.created_at}`);
      }
    }

    // Check commits
    const commitResult = await githubGet(`/repos/${repo}/commits?per_page=5`, user.accessToken);
    console.log(`  Commits API status: ${commitResult.status}, count: ${Array.isArray(commitResult.data) ? commitResult.data.length : 'N/A'}`);
    if (Array.isArray(commitResult.data) && commitResult.data.length > 0) {
      for (const c of commitResult.data.slice(0, 3)) {
        console.log(`    ${c.sha.substring(0,7)}: "${c.commit.message.split('\n')[0]}" by ${c.commit.author?.name} at ${c.commit.author?.date}`);
      }
    }
  }
}

main().finally(() => prisma.$disconnect());
