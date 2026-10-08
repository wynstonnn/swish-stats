// Reads the SWISH Player Tracker Excel file from its share link and returns the stats as JSON.
// Set the link once in Vercel: Project > Settings > Environment Variables > EXCEL_URL.
const XLSX = require('xlsx');
const { parse } = require('../lib/parser.js');

// Turn a normal "share" link into a direct-download link.
function directLink(url) {
  const u = url.trim();
  let m;
  // Google Sheets (a native Google sheet): export it as .xlsx
  if ((m = u.match(/docs\.google\.com\/spreadsheets\/d\/([\w-]+)/))) {
    return 'https://docs.google.com/spreadsheets/d/' + m[1] + '/export?format=xlsx';
  }
  // Google Drive (an uploaded .xlsx file)
  if ((m = u.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:.*&)?id=)([\w-]+)/))) {
    return 'https://drive.google.com/uc?export=download&id=' + m[1];
  }
  // Personal OneDrive (1drv.ms or onedrive.live.com links)
  if (/1drv\.ms|onedrive\.live\.com/.test(u)) {
    const b64 = Buffer.from(u).toString('base64').replace(/=+$/, '').replace(/\//g, '_').replace(/\+/g, '-');
    return 'https://api.onedrive.com/v1.0/shares/u!' + b64 + '/root/content';
  }
  // Work/school OneDrive or SharePoint
  if (/sharepoint\.com/.test(u)) {
    return u + (u.includes('?') ? '&' : '?') + 'download=1';
  }
  return u; // already a direct link
}

module.exports = async function handler(req, res) {
  const link = process.env.EXCEL_URL;
  if (!link) {
    res.status(500).json({ error: 'EXCEL_URL is not set in Vercel yet' });
    return;
  }
  try {
    const r = await fetch(directLink(link), { redirect: 'follow' });
    if (!r.ok) throw new Error('download failed with HTTP ' + r.status + '. Check the share link');
    const buf = Buffer.from(await r.arrayBuffer());
    // .xlsx files are zip files and start with "PK". Anything else is usually a sign-in page.
    if (buf.slice(0, 2).toString() !== 'PK') throw new Error('the link did not return an Excel file. Set sharing to "Anyone with the link"');
    const wb = XLSX.read(buf, { type: 'buffer' });
    const data = parse(XLSX, wb);
    if (!data.lines.length) throw new Error('no player rows found in the Player_Data sheet');
    data.source = 'live';
    // Vercel keeps the answer for 60 seconds, so edits show up within about a minute.
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    res.status(200).json(data);
  } catch (err) {
    res.setHeader('Cache-Control', 'no-store');
    res.status(502).json({ error: err.message });
  }
};
