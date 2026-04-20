import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const filename = request.nextUrl.searchParams.get('file');
    
    if (!filename) {
      return NextResponse.json(
        { error: 'File parameter is required' },
        { status: 400 }
      );
    }

    // Try to read from internal project directories first
    const projectRoot = process.cwd();
    const examplesDir = path.join(projectRoot, 'public', 'examples');
    let filePath = path.join(examplesDir, filename);
    let normalizedPath = path.normalize(filePath);
    
    // Prevent directory traversal attacks
    if (!normalizedPath.startsWith(examplesDir)) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Check if file exists in examples directory
    if (!fs.existsSync(normalizedPath)) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    const content = fs.readFileSync(normalizedPath, 'utf-8');
    return NextResponse.json({ content });
  } catch (error) {
    console.error('Error reading file:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
