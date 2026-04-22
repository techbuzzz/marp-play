import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * Returns the public-facing social URLs configured server-side so the
 * frontend doesn't need NEXT_PUBLIC_ prefixed env vars.
 */
export async function GET() {
  return NextResponse.json({
    linkedinUrl: process.env.LINKEDIN_PERS_URL || '',
    githubRepoUrl: process.env.GITHUB_CURRENT_REPO || '',
  })
}
