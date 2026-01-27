import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DNA_REPO_PATH = '/home/bs000716/dna-erp-demo/dna-repo';
const THRESHOLD_FILE = 'rules/approval-thresholds.md';

export async function GET() {
  try {
    const filePath = path.join(DNA_REPO_PATH, THRESHOLD_FILE);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'DNA file not found' }, { status: 404 });
    }

    const content = fs.readFileSync(filePath, 'utf-8');

    return NextResponse.json({
      content,
      file: THRESHOLD_FILE,
      lastModified: fs.statSync(filePath).mtime.toISOString()
    });
  } catch (error) {
    console.error('Error reading DNA file:', error);
    return NextResponse.json({ error: 'Failed to read DNA file' }, { status: 500 });
  }
}
