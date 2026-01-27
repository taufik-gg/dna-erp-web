import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const DNA_REPO_PATH = '/home/bs000716/dna-erp-demo/dna-repo';
const THRESHOLD_FILE = 'rules/approval-thresholds.md';
const ORCHESTRATOR_URL = 'http://localhost:5001/trigger';

export async function POST(request: NextRequest) {
  try {
    const { content, changes } = await request.json();

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const filePath = path.join(DNA_REPO_PATH, THRESHOLD_FILE);

    // Write the new content
    fs.writeFileSync(filePath, content, 'utf-8');

    // Create commit message from changes
    const commitMessage = changes && changes.length > 0
      ? `Update approval config: ${changes.slice(0, 2).join(', ')}${changes.length > 2 ? '...' : ''}`
      : 'Update approval thresholds via DNA Editor';

    // Git commit and push
    try {
      execSync('git add .', { cwd: DNA_REPO_PATH, stdio: 'pipe' });
      execSync(`git commit -m "${commitMessage}"`, { cwd: DNA_REPO_PATH, stdio: 'pipe' });
      execSync('git push origin main', { cwd: DNA_REPO_PATH, stdio: 'pipe' });
    } catch (gitError: any) {
      // If no changes to commit, that's okay
      if (!gitError.message.includes('nothing to commit')) {
        console.error('Git error:', gitError.message);
      }
    }

    // Trigger orchestrator to process the change
    try {
      const triggerResponse = await fetch(ORCHESTRATOR_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          files: [THRESHOLD_FILE],
          source: 'dna-editor',
          commitMessage
        })
      });

      if (!triggerResponse.ok) {
        console.warn('Orchestrator trigger warning:', await triggerResponse.text());
      }
    } catch (triggerError) {
      console.warn('Could not trigger orchestrator:', triggerError);
      // Don't fail the save if orchestrator is not available
    }

    return NextResponse.json({
      success: true,
      commitMessage,
      file: THRESHOLD_FILE,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Save error:', error);
    return NextResponse.json({
      error: 'Failed to save DNA file',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
