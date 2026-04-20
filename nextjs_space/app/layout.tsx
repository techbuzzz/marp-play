import { DM_Sans, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import { ChunkLoadErrorHandler } from '@/components/chunk-load-error-handler'
import type { Metadata } from 'next'
import { headers } from 'next/headers'

const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-sans' })
const jakartaSans = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-display' })
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' })

export const dynamic = 'force-dynamic'

const SITE_NAME = 'Marp Player'
const SITE_DESCRIPTION = 'Free online Markdown-to-Slides presentation player powered by Marp Core. Paste Marp markdown, preview slides in real-time, export to PDF, use fullscreen mode, and navigate with keyboard shortcuts or click-to-advance.'
const SITE_KEYWORDS = [
  'marp', 'marp player', 'markdown presentation', 'markdown slides',
  'marp viewer', 'marp online', 'presentation tool', 'markdown to slides',
  'marp core', 'slide deck', 'pdf export', 'fullscreen presentation',
  'speaker notes', 'marp syntax', 'markdown presenter', 'open source presentation',
  'free presentation tool', 'browser presentation', 'web presentation'
]

export async function generateMetadata(): Promise<Metadata> {
  const headersList = headers()
  const host = headersList.get('x-forwarded-host') || headersList.get('host') || 'marp-play.techbuzzz.me'
  const protocol = headersList.get('x-forwarded-proto') || 'https'
  const siteUrl = `${protocol}://${host}`

  return {
    title: {
      default: `${SITE_NAME} — Free Online Markdown Presentation Viewer`,
      template: `%s | ${SITE_NAME}`,
    },
    description: SITE_DESCRIPTION,
    keywords: SITE_KEYWORDS,
    authors: [{ name: 'Marp Player Team' }],
    creator: 'Marp Player Team',
    publisher: 'Marp Player',
    metadataBase: new URL(siteUrl),
    alternates: {
      canonical: '/',
    },
    icons: {
      icon: '/favicon.svg',
      shortcut: '/favicon.svg',
      apple: '/favicon.svg',
    },
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: siteUrl,
      siteName: SITE_NAME,
      title: `${SITE_NAME} — Free Online Markdown Presentation Viewer`,
      description: SITE_DESCRIPTION,
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: 'Marp Player — Markdown to Slides',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${SITE_NAME} — Free Online Markdown Presentation Viewer`,
      description: SITE_DESCRIPTION,
      images: ['/og-image.png'],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large' as const,
        'max-snippet': -1,
      },
    },
    verification: {},
    category: 'technology',
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script src="https://apps.abacus.ai/chatllm/appllm-lib.js"></script>
        <link rel="alternate" type="application/llms+txt" href="/llms.txt" />
      </head>
      <body className={`${dmSans.variable} ${jakartaSans.variable} ${jetbrainsMono.variable} font-sans`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <JsonLdScript />
          {children}
          <Toaster />
          <ChunkLoadErrorHandler />
        </ThemeProvider>
      </body>
    </html>
  )
}

function JsonLdScript() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Marp Player',
    description: SITE_DESCRIPTION,
    applicationCategory: 'Presentation',
    operatingSystem: 'Web Browser',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    featureList: [
      'Full Marp syntax support',
      'Real-time slide preview',
      'PDF export',
      'Fullscreen presentation mode',
      'Click-to-advance navigation',
      'Auto-play with configurable intervals',
      'Keyboard shortcuts',
      'Speaker notes',
      'Custom CSS themes',
      'Mobile-first responsive design',
      'Dark and light mode',
      'Save and load presentations',
      'Load .md files directly',
    ],
    softwareVersion: '1.0.0',
    author: {
      '@type': 'Organization',
      name: 'Marp Player Team',
    },
  }

  const webAppJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Marp Player',
    description: 'Free online Markdown-to-Slides presentation player with Marp Core rendering, PDF export, and fullscreen mode.',
    browserRequirements: 'Requires a modern web browser with JavaScript enabled',
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Any',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
  }

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What is Marp Player?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Marp Player is a free online tool that converts Marp-flavored Markdown into beautiful presentation slides. It supports real-time preview, PDF export, fullscreen mode, speaker notes, custom CSS themes, and keyboard navigation.',
        },
      },
      {
        '@type': 'Question',
        name: 'How do I use Marp Player?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Paste your Marp Markdown into the editor panel. Slides are separated by --- (three dashes). The preview updates in real-time. Use arrow keys to navigate, press F for fullscreen, or export to PDF with the download button.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can I export my presentation to PDF?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes! Click the PDF button in the toolbar to export your presentation as a high-quality PDF with one slide per page in 16:9 landscape format. All custom CSS styles are preserved in the export.',
        },
      },
      {
        '@type': 'Question',
        name: 'What Marp features are supported?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Marp Player supports the full Marp Core syntax including YAML frontmatter, custom CSS styles, built-in themes (default, gaia, uncover), pagination, footer/header directives, background images, math equations, code highlighting, and scoped class directives.',
        },
      },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
    </>
  )
}
