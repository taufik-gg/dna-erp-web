import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const DNA_REPO_PATH = '/home/bs000716/dna-erp-demo/dna-repo';
const LAYOUTS_DIR = 'layouts';
const ORCHESTRATOR_URL = 'http://localhost:5001/trigger';

export async function POST(request: NextRequest) {
  try {
    const { pageName, content, components } = await request.json();

    if (!pageName || !content) {
      return NextResponse.json({ error: 'Page name and content are required' }, { status: 400 });
    }

    // Sanitize page name for filename
    const fileName = pageName.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.md';
    const layoutsPath = path.join(DNA_REPO_PATH, LAYOUTS_DIR);
    const filePath = path.join(layoutsPath, fileName);

    // Ensure layouts directory exists
    if (!fs.existsSync(layoutsPath)) {
      fs.mkdirSync(layoutsPath, { recursive: true });
    }

    // Write the markdown file
    fs.writeFileSync(filePath, content, 'utf-8');

    // Also save JSON version for easier parsing
    const jsonPath = path.join(layoutsPath, fileName.replace('.md', '.json'));
    fs.writeFileSync(jsonPath, JSON.stringify({
      pageName,
      components,
      lastUpdated: new Date().toISOString(),
    }, null, 2), 'utf-8');

    // Git commit and push
    const commitMessage = `Update layout: ${pageName}`;
    try {
      execSync('git add .', { cwd: DNA_REPO_PATH, stdio: 'pipe' });
      execSync(`git commit -m "${commitMessage}"`, { cwd: DNA_REPO_PATH, stdio: 'pipe' });
      execSync('git push origin main', { cwd: DNA_REPO_PATH, stdio: 'pipe' });
    } catch (gitError: any) {
      if (!gitError.message.includes('nothing to commit')) {
        console.error('Git error:', gitError.message);
      }
    }

    // Trigger orchestrator
    try {
      await fetch(ORCHESTRATOR_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          files: [`${LAYOUTS_DIR}/${fileName}`],
          source: 'layout-editor',
          commitMessage
        })
      });
    } catch (triggerError) {
      console.warn('Could not trigger orchestrator:', triggerError);
    }

    return NextResponse.json({
      success: true,
      file: `${LAYOUTS_DIR}/${fileName}`,
      commitMessage,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Save layout error:', error);
    return NextResponse.json({
      error: 'Failed to save layout',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET endpoint to load existing layout
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pageName = searchParams.get('page');

    if (!pageName) {
      // Return list of all layouts
      const layoutsPath = path.join(DNA_REPO_PATH, LAYOUTS_DIR);
      if (!fs.existsSync(layoutsPath)) {
        return NextResponse.json({ layouts: [] });
      }

      const files = fs.readdirSync(layoutsPath).filter(f => f.endsWith('.json'));
      const layouts = files.map(f => {
        const content = fs.readFileSync(path.join(layoutsPath, f), 'utf-8');
        return JSON.parse(content);
      });

      return NextResponse.json({ layouts });
    }

    // Return specific layout
    const fileName = pageName.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.json';
    const filePath = path.join(DNA_REPO_PATH, LAYOUTS_DIR, fileName);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'Layout not found' }, { status: 404 });
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    return NextResponse.json(JSON.parse(content));

  } catch (error) {
    console.error('Load layout error:', error);
    return NextResponse.json({
      error: 'Failed to load layout',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
