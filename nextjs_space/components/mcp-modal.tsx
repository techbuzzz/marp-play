'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Check,
  Copy,
  ExternalLink,
  Code,
  Zap,
  BookOpen,
  Key,
  Linkedin,
  Github,
  Heart,
  ShieldAlert,
  Loader2,
  Eye,
  EyeOff,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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

interface GeneratedKey {
  keyId: string
  bearerToken: string
  createdAt: string
  label?: string | null
}

export function McpModal({ open, onOpenChange }: McpModalProps) {
  const [baseUrl, setBaseUrl] = useState('https://marp-play.techbuzzz.me')
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [githubRepoUrl, setGithubRepoUrl] = useState('')

  // API-key generation state
  const [linkedinAck, setLinkedinAck] = useState(false)
  const [githubAck, setGithubAck] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [generatedKey, setGeneratedKey] = useState<GeneratedKey | null>(null)
  const [revealSecret, setRevealSecret] = useState(false)
  const [savedAck, setSavedAck] = useState(false)

  const socialsAcknowledged = linkedinAck && githubAck

  // Set baseUrl and load social links on open.
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setBaseUrl(window.location.origin)
    }
    if (!open) return
    let cancelled = false
    fetch('/api/config/social')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data) return
        setLinkedinUrl(data.linkedinUrl || '')
        setGithubRepoUrl(data.githubRepoUrl || '')
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [open])

  // Reset transient UI state when modal closes.
  useEffect(() => {
    if (!open) {
      setGeneratedKey(null)
      setRevealSecret(false)
      setSavedAck(false)
      setGenerating(false)
      // Keep linkedinAck/githubAck so user doesn't have to re-tick if they reopen
    }
  }, [open])

  const tokenForSnippets = generatedKey?.bearerToken ?? 'YOUR_API_KEY'

  const mcpUrl = `${baseUrl}/api/v1/mcp`
  const openApiSpec = `${baseUrl}/api/v1/openapi`

  // Claude Desktop / Cline / Cursor — Streamable HTTP MCP transport.
  const claudeConfig = useMemo(
    () => `{
  "mcpServers": {
    "marp-player": {
      "type": "http",
      "url": "${mcpUrl}",
      "headers": {
        "Authorization": "Bearer ${tokenForSnippets}"
      }
    }
  }
}`,
    [mcpUrl, tokenForSnippets],
  )

  const curlExample = useMemo(
    () => `curl -X POST ${baseUrl}/api/v1/play \\
  -H "Authorization: Bearer ${tokenForSnippets}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "markdown": "# Hello\\n---\\n# World",
    "title": "My Presentation"
  }'`,
    [baseUrl, tokenForSnippets],
  )

  async function handleGenerateKey() {
    if (!socialsAcknowledged || generating) return
    setGenerating(true)
    try {
      const res = await fetch('/api/v1/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acknowledgedSocials: true }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.bearerToken) {
        throw new Error(data?.error || `Request failed (${res.status})`)
      }
      setGeneratedKey({
        keyId: data.keyId,
        bearerToken: data.bearerToken,
        createdAt: data.createdAt,
        label: data.label,
      })
      setRevealSecret(true)
      toast.success('API key generated — save it now!', { duration: 4000 })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not generate key')
    } finally {
      setGenerating(false)
    }
  }

  async function handleCopyToken() {
    if (!generatedKey) return
    try {
      await navigator.clipboard.writeText(generatedKey.bearerToken)
      toast.success('Bearer token copied', { duration: 1800 })
    } catch {
      toast.error('Could not copy')
    }
  }

  const maskedToken = generatedKey
    ? `${generatedKey.bearerToken.slice(0, 14)}${'•'.repeat(20)}${generatedKey.bearerToken.slice(-4)}`
    : ''

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
              assistants (Claude, Cursor, Cline, ChatGPT agents, etc.) call external tools. Marp
              Player exposes two integration paths: a proper <strong>MCP server</strong> over
              Streamable HTTP for native MCP clients, and an <strong>OpenAPI 3.1</strong> spec for
              platforms that consume tool definitions that way (OpenAI GPTs, LangChain, etc.).
            </p>
          </section>

          {/* Capabilities */}
          <section>
            <h3 className="text-sm font-semibold mb-2">MCP tools exposed to the agent</h3>
            <div className="grid sm:grid-cols-2 gap-2">
              {[
                {
                  title: 'create_share_link',
                  desc: 'Store Markdown → return a public play URL',
                },
                {
                  title: 'render_pdf',
                  desc: 'Markdown → 16:9 PDF (base64 resource)',
                },
                {
                  title: 'get_presentation',
                  desc: 'Fetch metadata & markdown by id',
                },
                {
                  title: 'delete_presentation',
                  desc: 'Revoke a shared presentation',
                },
              ].map((cap) => (
                <div
                  key={cap.title}
                  className="px-3 py-2 rounded-lg bg-muted/50 border border-border"
                >
                  <div className="text-xs sm:text-sm font-medium font-mono">{cap.title}</div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
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
              <li>Generate an API key below (replaces the placeholder in the snippets).</li>
              <li>
                Point your MCP client at the MCP server URL, or your OpenAPI tool at the
                spec URL.
              </li>
              <li>
                Pass the token as{' '}
                <code className="px-1 py-0.5 bg-muted rounded text-[10px] sm:text-xs">
                  Authorization: Bearer &lt;token&gt;
                </code>
                .
              </li>
            </ol>
          </section>

          {/* MCP Server URL (the real MCP endpoint) */}
          <section>
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-violet-500" />
              MCP server URL (Streamable HTTP)
            </h3>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 border border-border">
              <code className="text-[11px] sm:text-xs font-mono text-foreground truncate flex-1">
                {mcpUrl}
              </code>
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(mcpUrl)
                    toast.success('MCP URL copied', { duration: 1800 })
                  } catch {
                    toast.error('Could not copy')
                  }
                }}
                className="h-7 px-2"
                title="Copy URL"
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1.5 leading-relaxed">
              Use this URL in Claude Desktop, Cursor, Cline or any MCP client that speaks the
              Streamable HTTP transport (JSON-RPC 2.0 over HTTP POST).
            </p>
          </section>

          {/* OpenAPI URL (for GPTs / LangChain) */}
          <section>
            <h3 className="text-sm font-semibold mb-2">OpenAPI spec (GPTs / LangChain)</h3>
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
            <h3 className="text-sm font-semibold mb-2">Claude Desktop / Cursor / Cline config</h3>
            <CodeBlock code={claudeConfig} language="json" />
          </section>

          {/* cURL example */}
          <section>
            <h3 className="text-sm font-semibold mb-2">Quick test with cURL</h3>
            <CodeBlock code={curlExample} language="bash" />
          </section>

          {/* API Key generation */}
          <section className="rounded-xl border border-violet-200 dark:border-violet-900/60 bg-gradient-to-br from-violet-50 to-blue-50 dark:from-violet-950/30 dark:to-blue-950/30 p-4 sm:p-5">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-white dark:bg-slate-900 border border-violet-200 dark:border-violet-800 flex items-center justify-center shrink-0">
                <Key className="h-4 w-4 text-violet-600 dark:text-violet-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold">Generate an API key</h3>
                <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  Marp Player is a free, open tool. Before we hand out a Bearer token, we kindly
                  ask you to support the project — it costs you nothing and helps us grow.
                </p>
              </div>
            </div>

            {/* Social support ask */}
            {!generatedKey && (
              <div className="space-y-2.5 mb-4">
                <SocialAskRow
                  icon={<Linkedin className="h-3.5 w-3.5 text-[#0A66C2]" />}
                  label="Follow the author on LinkedIn"
                  url={linkedinUrl}
                  checked={linkedinAck}
                  onCheckedChange={setLinkedinAck}
                  ctaLabel="Open LinkedIn"
                />
                <SocialAskRow
                  icon={<Github className="h-3.5 w-3.5 text-slate-900 dark:text-slate-100" />}
                  label="Star / fork the repo on GitHub"
                  url={githubRepoUrl}
                  checked={githubAck}
                  onCheckedChange={setGithubAck}
                  ctaLabel="Open GitHub"
                />
                <p className="flex items-center gap-1.5 text-[10px] sm:text-xs text-muted-foreground pt-1">
                  <Heart className="h-3 w-3 text-rose-500 fill-rose-500" /> Thank you! The button
                  below unlocks once both boxes are checked.
                </p>
              </div>
            )}

            {/* Generate button (or generated key display) */}
            {!generatedKey ? (
              <Button
                onClick={handleGenerateKey}
                disabled={!socialsAcknowledged || generating}
                className="w-full h-9 gap-2 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Key className="h-4 w-4" />
                    Generate API Key
                  </>
                )}
              </Button>
            ) : (
              <div className="space-y-3">
                <div className="flex items-start gap-2 p-3 rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40">
                  <ShieldAlert className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-[11px] sm:text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
                    <strong>Save this token now.</strong> It is shown only once — we store only a
                    sha256 hash and cannot display it again. If you lose it, just generate a new
                    one.
                  </div>
                </div>

                <div>
                  <div className="text-[11px] text-muted-foreground mb-1 font-medium">
                    Bearer token {generatedKey.keyId ? <span className="font-mono text-[10px]">({generatedKey.keyId})</span> : null}
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-950 border border-slate-800">
                    <code className="text-[11px] sm:text-xs font-mono text-emerald-300 truncate flex-1">
                      {revealSecret ? generatedKey.bearerToken : maskedToken}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setRevealSecret((v) => !v)}
                      className="h-7 px-2 text-slate-300 hover:text-white hover:bg-slate-800"
                      title={revealSecret ? 'Hide' : 'Reveal'}
                    >
                      {revealSecret ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyToken}
                      className="h-7 px-2 text-slate-300 hover:text-white hover:bg-slate-800"
                      title="Copy token"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                <label className="flex items-start gap-2 text-[11px] sm:text-xs text-muted-foreground cursor-pointer">
                  <Checkbox
                    checked={savedAck}
                    onCheckedChange={(v) => setSavedAck(v === true)}
                    className="mt-0.5"
                  />
                  <span>
                    I have saved the Bearer token in a secure place. I understand it cannot be
                    recovered later.
                  </span>
                </label>

                <Button
                  onClick={() => {
                    setGeneratedKey(null)
                    setRevealSecret(false)
                    setSavedAck(false)
                  }}
                  disabled={!savedAck}
                  variant="outline"
                  className="w-full h-8 text-xs"
                >
                  Done — generate another
                </Button>
              </div>
            )}

            <p className="text-[10px] text-muted-foreground/80 mt-3 leading-relaxed">
              Unused API keys that never create a presentation are automatically purged after ~30
              days of inactivity to keep the database lean.
            </p>
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

interface SocialAskRowProps {
  icon: React.ReactNode
  label: string
  url: string
  checked: boolean
  onCheckedChange: (v: boolean) => void
  ctaLabel: string
}

function SocialAskRow({ icon, label, url, checked, onCheckedChange, ctaLabel }: SocialAskRowProps) {
  return (
    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-white/70 dark:bg-slate-900/60 border border-border">
      <Checkbox
        checked={checked}
        onCheckedChange={(v) => onCheckedChange(v === true)}
        className="shrink-0"
        id={`social-${label}`}
      />
      <label
        htmlFor={`social-${label}`}
        className="flex items-center gap-1.5 text-[11px] sm:text-xs font-medium flex-1 cursor-pointer"
      >
        {icon}
        {label}
      </label>
      {url ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}
          className="h-7 px-2 text-[10px] sm:text-xs gap-1"
          title={url}
        >
          {ctaLabel}
          <ExternalLink className="h-3 w-3" />
        </Button>
      ) : null}
    </div>
  )
}
