import { NextResponse } from 'next/server';
import { google } from 'googleapis';

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

export async function GET() {
  try {
    // Handle private key
    let privateKey = process.env.GOOGLE_PRIVATE_KEY || '';
    if (privateKey.includes('\\n')) {
      privateKey = privateKey.replace(/\\n/g, '\n');
    }

    const auth = new google.auth.GoogleAuth({
      credentials: {
        type: 'service_account',
        project_id: process.env.GOOGLE_PROJECT_ID,
        private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
        private_key: privateKey,
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        client_id: process.env.GOOGLE_CLIENT_ID,
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // Fetch all sheets in parallel
    const [volumeRes, txnsRes, buyersRes, sellersRes, gamedRes, avgTxnRes, snapshotRes] = await Promise.all([
      sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: `${SHEET_NAMES.volume}!A:C` }),
      sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: `${SHEET_NAMES.txns}!A:C` }),
      sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: `${SHEET_NAMES.buyers}!A:C` }),
      sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: `${SHEET_NAMES.sellers}!A:C` }),
      sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: `${SHEET_NAMES.gamed}!A:C` }),
      sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: `${SHEET_NAMES.avg_txn}!A:C` }),
      sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: `${SHEET_NAMES.snapshot}!A:M` }),
    ]);

    // Parse time series data
    const volume = parseTimeSeriesData((volumeRes.data.values || []).slice(1));
    const txns = parseTimeSeriesData((txnsRes.data.values || []).slice(1));
    const buyers = parseTimeSeriesData((buyersRes.data.values || []).slice(1));
    const sellers = parseTimeSeriesData((sellersRes.data.values || []).slice(1));
    const gamed = parseTimeSeriesData((gamedRes.data.values || []).slice(1)).map(p => ({
      ...p,
      v: p.v * 100,
    }));
    const avgTxn = parseTimeSeriesData((avgTxnRes.data.values || []).slice(1));

    // Parse snapshot data
    const snapshotRows = snapshotRes.data.values || [];
    const x402Row = snapshotRows.find(row => row[0] === 'x402') || [];
    const mppRow = snapshotRows.find(row => row[0] === 'MPP') || [];

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
