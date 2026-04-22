'use client'

import { useState, useEffect } from 'react'
import { Check, Copy, ExternalLink, Code, Zap, BookOpen } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface McpModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface CodeBlockProps {
  code: string
  language?: string
  label?: string
}

function CodeBlock({ code, language = 'json', label }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      toast.success('Copied to clipboard', { duration: 1800 })
      setTimeout(() => setCopied(false), 1600)
    } catch {
      toast.error('Could not copy')
    }
  }

  return (
    <div className="relative group">
      {label && (
        <div className="text-xs text-muted-foreground mb-1.5 font-medium">{label}</div>
      )}
      <pre className="bg-slate-950 text-slate-100 rounded-lg p-3 sm:p-4 overflow-x-auto text-[11px] sm:text-xs leading-relaxed border border-slate-800">
        <code className={`language-${language}`}>{code}</code>
      </pre>
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-1.5 rounded-md bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white transition-all opacity-0 group-hover:opacity-100"
        title="Copy code"
      >
        {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
    </div>
  )
}

export function McpModal({ open, onOpenChange }: McpModalProps) {
  const [baseUrl, setBaseUrl] = useState('https://marp-play.techbuzzz.me')

  // Set baseUrl to the current origin on mount / open
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setBaseUrl(window.location.origin)
    }
  }, [open])

  const claudeConfig = `{
  "mcpServers": {
    "marp-player": {
      "url": "${baseUrl}/api/v1/openapi",
      "headers": {
        "Authorization": "Bearer YOUR_API_KEY"
      }
    }
  }
}`

  const curlExample = `curl -X POST ${baseUrl}/api/v1/play \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "markdown": "# Hello\\n---\\n# World",
    "title": "My Presentation"
  }'`

  const openApiSpec = `${baseUrl}/api/v1/openapi`

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center shrink-0">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-lg sm:text-xl">MCP &amp; API Integration</DialogTitle>
              <DialogDescription className="text-xs sm:text-sm mt-0.5">
                Connect AI agents to Marp Player via Model Context Protocol
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5 sm:space-y-6 pt-1">
          {/* What is MCP */}
          <section>
            <h3 className="text-sm font-semibold mb-1.5 flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5 text-violet-500" />
              What is MCP?
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              The <strong>Model Context Protocol</strong> (MCP) is an open standard that lets AI
              assistants (Claude, ChatGPT, Gemini, agents, etc.) call external tools. Marp Player
              exposes an OpenAPI-compliant endpoint that AI agents can use to render Markdown into
              slide-deck PDFs, create shareable presentations, and manage them programmatically.
            </p>
          </section>

          {/* Capabilities */}
          <section>
            <h3 className="text-sm font-semibold mb-2">What AI agents can do</h3>
            <div className="grid sm:grid-cols-2 gap-2">
              {[
                { title: 'Render PDF', desc: 'POST /api/v1/render-pdf — Markdown → PDF download' },
                { title: 'Create share link', desc: 'POST /api/v1/play — generate a public URL' },
                { title: 'Get presentation', desc: 'GET /api/v1/presentations/[id] — fetch metadata' },
                { title: 'Delete presentation', desc: 'DELETE /api/v1/presentations/[id] — remove' },
              ].map((cap) => (
                <div
                  key={cap.title}
                  className="px-3 py-2 rounded-lg bg-muted/50 border border-border"
                >
                  <div className="text-xs sm:text-sm font-medium">{cap.title}</div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground font-mono mt-0.5">
                    {cap.desc}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Setup */}
          <section>
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
              <Code className="h-3.5 w-3.5 text-blue-500" />
              How to connect
            </h3>
            <ol className="text-xs sm:text-sm text-muted-foreground space-y-1.5 list-decimal list-inside">
              <li>
                Get an API key from your Marp Player admin (env var <code className="px-1 py-0.5 bg-muted rounded text-[10px] sm:text-xs">MARP_API_KEYS</code>).
              </li>
              <li>Point your AI agent / MCP client at the OpenAPI spec.</li>
              <li>Pass the key as <code className="px-1 py-0.5 bg-muted rounded text-[10px] sm:text-xs">Authorization: Bearer &lt;key&gt;</code>.</li>
            </ol>
          </section>

          {/* OpenAPI URL */}
          <section>
            <h3 className="text-sm font-semibold mb-2">OpenAPI specification</h3>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 border border-border">
              <code className="text-[11px] sm:text-xs font-mono text-foreground truncate flex-1">
                {openApiSpec}
              </code>
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(openApiSpec)
                    toast.success('OpenAPI URL copied', { duration: 1800 })
                  } catch {
                    toast.error('Could not copy')
                  }
                }}
                className="h-7 px-2"
                title="Copy URL"
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open(openApiSpec, '_blank')}
                className="h-7 px-2"
                title="Open spec"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </div>
          </section>

          {/* Config example */}
          <section>
            <h3 className="text-sm font-semibold mb-2">Claude / MCP client config</h3>
            <CodeBlock code={claudeConfig} language="json" />
          </section>

          {/* cURL example */}
          <section>
            <h3 className="text-sm font-semibold mb-2">Quick test with cURL</h3>
            <CodeBlock code={curlExample} language="bash" />
          </section>

          {/* Footer links */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open('/api/v1/openapi', '_blank')}
              className="h-8 gap-1.5 text-xs"
            >
              <ExternalLink className="h-3 w-3" />
              View OpenAPI Spec
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open('/llms-full.txt', '_blank')}
              className="h-8 gap-1.5 text-xs"
            >
              <ExternalLink className="h-3 w-3" />
              LLM Docs
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open('https://modelcontextprotocol.io', '_blank')}
              className="h-8 gap-1.5 text-xs"
            >
              <ExternalLink className="h-3 w-3" />
              About MCP
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
