import { NextResponse } from 'next/server';
import { SignJWT, importPKCS8 } from 'jose';

const SPREADSHEET_ID = '1z2EtDU6YXownVQkX5VL2tqvbo2TcOv4BJydraXVzcnE';

const SHEET_NAMES = {
  volume: 'raw_volume',
  txns: 'raw_txns',
  buyers: 'raw_buyers',
  sellers: 'raw_sellers',
  gamed: 'raw_gamed',
  avg_txn: 'raw_avg_txn',
  snapshot: 'snapshot',
};

function parseDate(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const month = parseInt(parts[0]);
    const day = parseInt(parts[1]);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[month - 1]} ${day}`;
  }
  return dateStr;
}

function parseTimeSeriesData(rows: string[][]) {
  return rows
    .filter(row => row[1] && row[2])
    .map(row => ({
      d: parseDate(row[1]),
      v: parseFloat(row[2]) || 0,
    }))
    .filter(point => !isNaN(point.v));
}

async function getAccessToken(): Promise<string> {
  // Try base64-encoded key first, then fall back to regular env var
  const b64Key = process.env.GOOGLE_PRIVATE_KEY_B64;
  let privateKey: string;

  if (b64Key) {
    // Decode from base64
    privateKey = Buffer.from(b64Key, 'base64').toString('utf-8');
  } else {
    // Fall back to regular env var with newline handling
    privateKey = process.env.GOOGLE_PRIVATE_KEY || '';

    // Handle literal \n sequences
    if (!privateKey.includes('-----BEGIN PRIVATE KEY-----\n')) {
      privateKey = privateKey.replace(/\\n/g, '\n');
    }
  }

  // Validate the key format
  if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
    throw new Error(`Invalid private key format. Key length: ${privateKey.length}, starts with: ${JSON.stringify(privateKey.substring(0, 80))}`);
  }

  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL || '';

  // Import the private key using jose
  const key = await importPKCS8(privateKey, 'RS256');

  const now = Math.floor(Date.now() / 1000);

  // Create JWT with RS256 using jose
  const token = await new SignJWT({
    scope: 'https://www.googleapis.com/auth/spreadsheets.readonly',
  })
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .setIssuer(clientEmail)
    .setAudience('https://oauth2.googleapis.com/token')
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(key);

  // Exchange JWT for access token
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: token,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${error}`);
  }

  const data = await response.json();
  return data.access_token;
}

async function fetchSheet(accessToken: string, sheetName: string, range: string = 'A:C') {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(sheetName)}!${range}`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${sheetName}: ${response.statusText}`);
  }

  const data = await response.json();
  return data.values || [];
}

export async function GET() {
  try {
    const accessToken = await getAccessToken();

    // Fetch all sheets in parallel
    const [volumeRows, txnsRows, buyersRows, sellersRows, gamedRows, avgTxnRows, snapshotRows] = await Promise.all([
      fetchSheet(accessToken, SHEET_NAMES.volume),
      fetchSheet(accessToken, SHEET_NAMES.txns),
      fetchSheet(accessToken, SHEET_NAMES.buyers),
      fetchSheet(accessToken, SHEET_NAMES.sellers),
      fetchSheet(accessToken, SHEET_NAMES.gamed),
      fetchSheet(accessToken, SHEET_NAMES.avg_txn),
      fetchSheet(accessToken, SHEET_NAMES.snapshot, 'A:M'),
    ]);

    // Parse time series data
    const volume = parseTimeSeriesData(volumeRows.slice(1));
    const txns = parseTimeSeriesData(txnsRows.slice(1));
    const buyers = parseTimeSeriesData(buyersRows.slice(1));
    const sellers = parseTimeSeriesData(sellersRows.slice(1));
    const gamed = parseTimeSeriesData(gamedRows.slice(1)).map(p => ({
      ...p,
      v: p.v * 100,
    }));
    const avgTxn = parseTimeSeriesData(avgTxnRows.slice(1));

    // Parse snapshot data
    const x402Row = snapshotRows.find((row: string[]) => row[0] === 'x402') || [];
    const mppRow = snapshotRows.find((row: string[]) => row[0] === 'MPP') || [];

    const snapshot = {
      x402: {
        buyers: x402Row[1] || '0',
        sellers: x402Row[2] || '0',
        realVolume: x402Row[3] || '0',
        realTxns: x402Row[4] || '0',
        gamedTxns: x402Row[5] || '0',
        percentGamedTxns: x402Row[6] || '0%',
        percentGamedVolume: x402Row[7] || '0%',
        cumulativeBuyers: x402Row[8] || '0',
        cumulativeSellers: x402Row[9] || '0',
        cumulativeTxns: x402Row[10] || '0',
        cumulativeVolume: x402Row[11] || '0',
        avgTxnSize: x402Row[12] || '0',
      },
      mpp: {
        buyers: mppRow[1] || '0',
        sellers: mppRow[2] || '0',
        realVolume: mppRow[3] || '0',
        realTxns: mppRow[4] || '0',
        gamedTxns: mppRow[5] || '0',
        percentGamedTxns: mppRow[6] || '0%',
        percentGamedVolume: mppRow[7] || '0%',
        cumulativeBuyers: mppRow[8] || '0',
        cumulativeSellers: mppRow[9] || '0',
        cumulativeTxns: mppRow[10] || '0',
        cumulativeVolume: mppRow[11] || '0',
        avgTxnSize: mppRow[12] || '0',
      },
    };

    const data = {
      volume,
      txns,
      buyers,
      sellers,
      gamed,
      avgTxn,
      snapshot,
      lastUpdated: new Date().toISOString(),
    };

    // Cache for 24 hours
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=43200',
      },
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
