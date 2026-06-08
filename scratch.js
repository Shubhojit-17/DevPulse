const https = require('https');
https.get({
  hostname: 'api.github.com',
  path: '/repos/Shubhojit-17/Health-KAave/pulls?state=all&sort=updated&direction=desc&per_page=1&page=1',
  headers: { 'User-Agent': 'Node.js' }
}, (res) => {
  let data = '';
  res.on('data', d => data += d);
  res.on('end', () => console.log('Status:', res.statusCode, 'Data length:', data.length));
});
