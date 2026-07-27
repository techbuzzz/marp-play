import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

const FALLBACK_DESCRIPTION =
  'View this Marp presentation online — navigate slides with your keyboard, present in fullscreen, and download as PDF. Powered by Marp Player.'

export async function generateMetadata({
  params,
}: {
  params: { id: string }
}): Promise<Metadata> {
  const headersList = headers()
  const host =
    headersList.get('x-forwarded-host') ||
    headersList.get('host') ||
    'marp-play.techbuzzz.me'
  const protocol = headersList.get('x-forwarded-proto') || 'https'
  const siteUrl = `${protocol}://${host}`
  const canonical = `${siteUrl}/play/${params.id}`

  let title = 'Shared Presentation'
  let slideCount = 0

  try {
    const presentation = await prisma.sharedPresentation.findUnique({
      where: { id: params.id },
      select: { title: true, slideCount: true },
    })
    if (presentation) {
      title = presentation.title || title
      slideCount = presentation.slideCount || 0
    }
  } catch {
    // Fall back to generic metadata if the lookup fails.
  }

  const description = slideCount
    ? `"${title}" — a ${slideCount}-slide Marp presentation. View online, present in fullscreen, or download as PDF.`
    : FALLBACK_DESCRIPTION

  return {
    metadataBase: new URL(siteUrl),
    title,
    description,
    alternates: {
      canonical,
    },
    // Shared decks are ephemeral, user-generated content (they can expire), so
    // we keep them out of the search index to avoid thin/expired pages, while
    // still allowing crawlers to follow links and honour rich share previews.
    robots: {
      index: false,
      follow: true,
    },
    openGraph: {
      type: 'article',
      url: canonical,
      siteName: 'Marp Player',
      title,
      description,
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: `${title} — Marp Player`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/og-image.png'],
    },
  }
}

export default function PlayLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
