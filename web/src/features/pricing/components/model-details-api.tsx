/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
import {
  ChevronRight,
  Gauge,
  KeyRound,
  ScrollText,
  Sigma,
  Zap,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { BundledLanguage } from 'shiki/bundle/web'

import {
  CodeBlock,
  CodeBlockCopyButton,
} from '@/components/ai-elements/code-block'
import { StaticDataTable } from '@/components/data-table'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useStatus } from '@/hooks/use-status'

import {
  buildRateLimits,
  buildSupportedParameters,
  formatRateLimit,
  type SupportedParameter,
} from '../lib/mock-stats'
import { replaceModelInPath } from '../lib/model-helpers'
import type { PricingModel } from '../types'

type Lang = 'curl' | 'python' | 'typescript' | 'javascript'

const LANG_LABELS: Record<Lang, string> = {
  curl: 'cURL',
  python: 'Python',
  typescript: 'TypeScript',
  javascript: 'JavaScript',
}

const LANG_HIGHLIGHT: Record<Lang, BundledLanguage> = {
  curl: 'bash',
  python: 'python',
  typescript: 'typescript',
  javascript: 'javascript',
}

type SampleContext = {
  baseUrl: string
  apiKeyEnv: string
  modelName: string
  endpointType: string
  endpointPath: string
}

function buildChatSample(lang: Lang, ctx: SampleContext): string {
  const url = `${ctx.baseUrl}${ctx.endpointPath}`
  const isResponses = ctx.endpointType === 'openai-response'
  const isReasoning = /^o[1-4]|reasoning|thinking|deepseek-r/i.test(
    ctx.modelName
  )
  const userMessage = 'Explain quantum entanglement in one paragraph.'

  const bodyJson = isResponses
    ? JSON.stringify({ model: ctx.modelName, input: userMessage }, null, 2)
    : JSON.stringify(
        {
          model: ctx.modelName,
          messages: [{ role: 'user', content: userMessage }],
          ...(isReasoning ? {} : { temperature: 0.7 }),
        },
        null,
        2
      )

  const fnCall = isResponses ? 'responses.create' : 'chat.completions.create'

  if (lang === 'curl') {
    return [
      `curl ${url} \\`,
      `  -H "Authorization: Bearer $${ctx.apiKeyEnv}" \\`,
      `  -H "Content-Type: application/json" \\`,
      `  -d '${bodyJson.replace(/\n/g, '\n     ')}'`,
    ].join('\n')
  }

  if (lang === 'python') {
    return [
      'from openai import OpenAI',
      '',
      'client = OpenAI(',
      `    base_url="${ctx.baseUrl}/v1",`,
      `    api_key="<YOUR_API_KEY>",`,
      ')',
      '',
      isResponses
        ? `response = client.${fnCall}(\n    model="${ctx.modelName}",\n    input="${userMessage}",\n)\n\nprint(response.output_text)`
        : `completion = client.${fnCall}(\n    model="${ctx.modelName}",\n    messages=[\n        {"role": "user", "content": "${userMessage}"}\n    ],\n)\n\nprint(completion.choices[0].message.content)`,
    ].join('\n')
  }

  if (lang === 'typescript') {
    return [
      `import OpenAI from 'openai'`,
      '',
      `const client = new OpenAI({`,
      `  baseURL: '${ctx.baseUrl}/v1',`,
      `  apiKey: process.env.${ctx.apiKeyEnv},`,
      `})`,
      '',
      isResponses
        ? `const response = await client.${fnCall}({\n  model: '${ctx.modelName}',\n  input: '${userMessage}',\n})\n\nconsole.log(response.output_text)`
        : `const completion = await client.${fnCall}({\n  model: '${ctx.modelName}',\n  messages: [{ role: 'user', content: '${userMessage}' }],\n})\n\nconsole.log(completion.choices[0].message.content)`,
    ].join('\n')
  }

  return [
    `const response = await fetch('${url}', {`,
    `  method: 'POST',`,
    `  headers: {`,
    `    Authorization: \`Bearer \${process.env.${ctx.apiKeyEnv}}\`,`,
    `    'Content-Type': 'application/json',`,
    `  },`,
    `  body: JSON.stringify(${bodyJson}),`,
    `})`,
    '',
    `const data = await response.json()`,
    `console.log(data)`,
  ].join('\n')
}

function buildAnthropicSample(lang: Lang, ctx: SampleContext): string {
  const url = `${ctx.baseUrl}${ctx.endpointPath}`
  const userMessage = 'Explain quantum entanglement in one paragraph.'

  if (lang === 'curl') {
    const body = JSON.stringify(
      {
        model: ctx.modelName,
        max_tokens: 1024,
        messages: [{ role: 'user', content: userMessage }],
      },
      null,
      2
    )
    return [
      `curl ${url} \\`,
      `  -H "x-api-key: $${ctx.apiKeyEnv}" \\`,
      `  -H "anthropic-version: 2023-06-01" \\`,
      `  -H "Content-Type: application/json" \\`,
      `  -d '${body.replace(/\n/g, '\n     ')}'`,
    ].join('\n')
  }
  if (lang === 'python') {
    return [
      'import anthropic',
      '',
      'client = anthropic.Anthropic(',
      `    base_url="${ctx.baseUrl}",`,
      `    api_key="<YOUR_API_KEY>",`,
      ')',
      '',
      `message = client.messages.create(`,
      `    model="${ctx.modelName}",`,
      `    max_tokens=1024,`,
      `    messages=[{"role": "user", "content": "${userMessage}"}],`,
      ')',
      '',
      'print(message.content[0].text)',
    ].join('\n')
  }
  if (lang === 'typescript') {
    return [
      `import Anthropic from '@anthropic-ai/sdk'`,
      '',
      `const client = new Anthropic({`,
      `  baseURL: '${ctx.baseUrl}',`,
      `  apiKey: process.env.${ctx.apiKeyEnv},`,
      `})`,
      '',
      `const message = await client.messages.create({`,
      `  model: '${ctx.modelName}',`,
      `  max_tokens=1024,`,
      `  messages: [{ role: 'user', content: '${userMessage}' }],`,
      `})`,
      '',
      `console.log(message.content[0].text)`,
    ].join('\n')
  }
  return [
    `const response = await fetch('${url}', {`,
    `  method: 'POST',`,
    `  headers: {`,
    `    'x-api-key': process.env.${ctx.apiKeyEnv},`,
    `    'anthropic-version': '2023-06-01',`,
    `    'Content-Type': 'application/json',`,
    `  },`,
    `  body: JSON.stringify({`,
    `    model: '${ctx.modelName}',`,
    `    max_tokens: 1024,`,
    `    messages: [{ role: 'user', content: '${userMessage}' }],`,
    `  }),`,
    `})`,
    '',
    `const data = await response.json()`,
    `console.log(data.content[0].text)`,
  ].join('\n')
}

function buildGeminiSample(lang: Lang, ctx: SampleContext): string {
  const url = `${ctx.baseUrl}${ctx.endpointPath}?key=$${ctx.apiKeyEnv}`
  const userMessage = 'Explain quantum entanglement in one paragraph.'

  if (lang === 'curl') {
    const body = JSON.stringify(
      { contents: [{ parts: [{ text: userMessage }] }] },
      null,
      2
    )
    return [
      `curl '${url}' \\`,
      `  -H 'Content-Type: application/json' \\`,
      `  -d '${body.replace(/\n/g, '\n     ')}'`,
    ].join('\n')
  }
  if (lang === 'python') {
    return [
      'import google.generativeai as genai',
      '',
      `genai.configure(api_key="<YOUR_API_KEY>")`,
      '',
      `model = genai.GenerativeModel("${ctx.modelName}")`,
      `response = model.generate_content("${userMessage}")`,
      '',
      `print(response.text)`,
    ].join('\n')
  }
  if (lang === 'typescript') {
    return [
      `import { GoogleGenerativeAI } from '@google/generative-ai'`,
      '',
      `const genAI = new GoogleGenerativeAI(process.env.${ctx.apiKeyEnv}!)`,
      `const model = genAI.getGenerativeModel({ model: '${ctx.modelName}' })`,
      '',
      `const result = await model.generateContent('${userMessage}')`,
      `console.log(result.response.text())`,
    ].join('\n')
  }
  return [
    `const response = await fetch('${url}', {`,
    `  method: 'POST',`,
    `  headers: { 'Content-Type': 'application/json' },`,
    `  body: JSON.stringify({`,
    `    contents: [{ parts: [{ text: '${userMessage}' }] }],`,
    `  }),`,
    `})`,
    '',
    `const data = await response.json()`,
    `console.log(data.candidates[0].content.parts[0].text)`,
  ].join('\n')
}

function buildEmbeddingSample(lang: Lang, ctx: SampleContext): string {
  const url = `${ctx.baseUrl}${ctx.endpointPath}`
  const text = 'The food was delicious and the waiter…'

  if (lang === 'curl') {
    const body = JSON.stringify({ model: ctx.modelName, input: text }, null, 2)
    return [
      `curl ${url} \\`,
      `  -H "Authorization: Bearer $${ctx.apiKeyEnv}" \\`,
      `  -H "Content-Type: application/json" \\`,
      `  -d '${body.replace(/\n/g, '\n     ')}'`,
    ].join('\n')
  }
  if (lang === 'python') {
    return [
      'from openai import OpenAI',
      '',
      `client = OpenAI(base_url="${ctx.baseUrl}/v1", api_key="<YOUR_API_KEY>")`,
      '',
      'response = client.embeddings.create(',
      `    model="${ctx.modelName}",`,
      `    input="${text}",`,
      ')',
      '',
      'print(response.data[0].embedding[:8])',
    ].join('\n')
  }
  if (lang === 'typescript') {
    return [
      `import OpenAI from 'openai'`,
      '',
      `const client = new OpenAI({`,
      `  baseURL: '${ctx.baseUrl}/v1',`,
      `  apiKey: process.env.${ctx.apiKeyEnv},`,
      `})`,
      '',
      `const response = await client.embeddings.create({`,
      `  model: '${ctx.modelName}',`,
      `  input: '${text}',`,
      `})`,
      '',
      `console.log(response.data[0].embedding.slice(0, 8))`,
    ].join('\n')
  }
  return [
    `const response = await fetch('${url}', {`,
    `  method: 'POST',`,
    `  headers: {`,
    `    Authorization: \`Bearer \${process.env.${ctx.apiKeyEnv}}\`,`,
    `    'Content-Type': 'application/json',`,
    `  },`,
    `  body: JSON.stringify({`,
    `    model: '${ctx.modelName}',`,
    `    input: '${text}',`,
    `  }),`,
    `})`,
    '',
    `const data = await response.json()`,
    `console.log(data.data[0].embedding.slice(0, 8))`,
  ].join('\n')
}

function buildImageSample(lang: Lang, ctx: SampleContext): string {
  const url = `${ctx.baseUrl}${ctx.endpointPath}`
  const prompt = 'A serene koi pond at sunset, ukiyo-e style.'

  if (lang === 'curl') {
    const body = JSON.stringify(
      { model: ctx.modelName, prompt, size: '1024x1024', n: 1 },
      null,
      2
    )
    return [
      `curl ${url} \\`,
      `  -H "Authorization: Bearer $${ctx.apiKeyEnv}" \\`,
      `  -H "Content-Type: application/json" \\`,
      `  -d '${body.replace(/\n/g, '\n     ')}'`,
    ].join('\n')
  }
  if (lang === 'python') {
    return [
      'from openai import OpenAI',
      '',
      `client = OpenAI(base_url="${ctx.baseUrl}/v1", api_key="<YOUR_API_KEY>")`,
      '',
      'response = client.images.generate(',
      `    model="${ctx.modelName}",`,
      `    prompt="${prompt}",`,
      `    size="1024x1024",`,
      `    n=1,`,
      ')',
      '',
      'print(response.data[0].url)',
    ].join('\n')
  }
  if (lang === 'typescript') {
    return [
      `import OpenAI from 'openai'`,
      '',
      `const client = new OpenAI({`,
      `  baseURL: '${ctx.baseUrl}/v1',`,
      `  apiKey: process.env.${ctx.apiKeyEnv},`,
      `})`,
      '',
      `const response = await client.images.generate({`,
      `  model: '${ctx.modelName}',`,
      `  prompt: '${prompt}',`,
      `  size: '1024x1024',`,
      `  n: 1,`,
      `})`,
      '',
      `console.log(response.data[0].url)`,
    ].join('\n')
  }
  return [
    `const response = await fetch('${url}', {`,
    `  method: 'POST',`,
    `  headers: {`,
    `    Authorization: \`Bearer \${process.env.${ctx.apiKeyEnv}}\`,`,
    `    'Content-Type': 'application/json',`,
    `  },`,
    `  body: JSON.stringify({`,
    `    model: '${ctx.modelName}',`,
    `    prompt: '${prompt}',`,
    `    size: '1024x1024',`,
    `    n: 1,`,
    `  }),`,
    `})`,
    '',
    `const data = await response.json()`,
    `console.log(data.data[0].url)`,
  ].join('\n')
}

function buildSample(
  lang: Lang,
  endpointType: string,
  ctx: SampleContext
): string {
  if (endpointType === 'anthropic') return buildAnthropicSample(lang, ctx)
  if (endpointType === 'gemini') return buildGeminiSample(lang, ctx)
  if (endpointType === 'embeddings' || endpointType === 'jina-rerank')
    return buildEmbeddingSample(lang, ctx)
  if (endpointType === 'image-generation') return buildImageSample(lang, ctx)
  return buildChatSample(lang, ctx)
}

function CodeSamplesSection(props: {
  model: PricingModel
  endpointMap: Record<string, { path?: string; method?: string }>
}) {
  const { t } = useTranslation()
  const { status } = useStatus()

  const baseUrl = useMemo(() => {
    const candidate =
      (status as Record<string, unknown> | null)?.server_address ??
      (status as Record<string, unknown> | null)?.serverAddress ??
      (status?.data as Record<string, unknown> | undefined)?.server_address ??
      (status?.data as Record<string, unknown> | undefined)?.serverAddress
    if (candidate && typeof candidate === 'string') {
      return candidate.replace(/\/$/, '')
    }
    if (typeof window !== 'undefined') return window.location.origin
    return 'https://api.example.com'
  }, [status])

  const endpoints = useMemo(() => {
    const types = props.model.supported_endpoint_types || []
    return types
      .map((type) => {
        const info = props.endpointMap[type] || {}
        let path = info.path || ''
        if (path && path.includes('{model}')) {
          path = replaceModelInPath(path, props.model.model_name || '')
        }
        return { type, path, method: info.method || 'POST' }
      })
      .filter((e) => Boolean(e.path))
  }, [props.model, props.endpointMap])

  const [endpointType, setEndpointType] = useState<string>(
    endpoints[0]?.type ?? ''
  )
  const [lang, setLang] = useState<Lang>('curl')

  const activeEndpoint = useMemo(() => {
    return endpoints.find((e) => e.type === endpointType) ?? endpoints[0]
  }, [endpointType, endpoints])

  if (endpoints.length === 0 || !activeEndpoint) {
    return null
  }

  const code = buildSample(lang, activeEndpoint.type, {
    baseUrl,
    apiKeyEnv: 'NEW_API_KEY',
    modelName: props.model.model_name || '',
    endpointType: activeEndpoint.type,
    endpointPath: activeEndpoint.path,
  })

  return (
    <section>
      <SectionTitle icon={ScrollText}>{t('Code samples')}</SectionTitle>

      <div className='flex flex-wrap items-center gap-2'>
        {endpoints.length > 1 && (
          <Tabs value={endpointType} onValueChange={setEndpointType}>
            <TabsList className='inline-flex h-8 gap-0.5 rounded-full bg-[#F7F8FA] p-0.5'>
              {endpoints.map((ep) => (
                <TabsTrigger
                  key={ep.type}
                  value={ep.type}
                  className='h-7 rounded-full px-2.5 pl-font-display text-[11px] font-semibold data-[state=active]:bg-[#0A0E1A] data-[state=active]:text-white data-[state=active]:shadow-sm'
                >
                  {ep.type}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        )}

        <Tabs
          value={lang}
          onValueChange={(v) => setLang(v as Lang)}
          className='ml-auto'
        >
          <TabsList className='inline-flex h-8 gap-0.5 rounded-full bg-[#F7F8FA] p-0.5'>
            {(Object.keys(LANG_LABELS) as Lang[]).map((l) => (
              <TabsTrigger
                key={l}
                value={l}
                className='h-7 rounded-full px-2.5 pl-font-display text-[11px] font-semibold data-[state=active]:bg-[#0A0E1A] data-[state=active]:text-white data-[state=active]:shadow-sm'
              >
                {LANG_LABELS[l]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div className='mt-3'>
        <CodeBlock
          code={code}
          language={LANG_HIGHLIGHT[lang]}
          className='!rounded-2xl !border-[#E5E8EE] !bg-[#FAFBFC] !shadow-sm'
        >
          <CodeBlockCopyButton />
        </CodeBlock>
      </div>

      <p className='mt-2 text-[12px] text-[#8A93A4]'>
        {t('Replace')}{' '}
        <code className='rounded-[6px] bg-[#F0F2F6] px-1.5 py-0.5 font-mono text-[11px] text-[#0A0E1A]'>
          {'<YOUR_API_KEY>'}
        </code>{' '}
        {t('with the API key from your token settings.')}
      </p>
    </section>
  )
}

const plTh = 'pl-font-mono py-3 text-[9px] text-[#8A93A4]'
const plCell = 'py-3 text-[13px] text-[#5A6478]'
const plCellCode = 'py-3 font-mono text-[13px] text-[#0A0E1A]'
const plCellNum =
  'py-3 text-right font-mono text-[13px] font-semibold tabular-nums text-[#0A0E1A]'

function SupportedParametersSection(props: { model: PricingModel }) {
  const { t } = useTranslation()
  const params = useMemo(
    () => buildSupportedParameters(props.model),
    [props.model]
  )

  if (params.length === 0) return null

  return (
    <section>
      <SectionTitle icon={Sigma}>{t('Supported parameters')}</SectionTitle>
      <StaticDataTable
        className='overflow-hidden rounded-2xl border border-[#E5E8EE] bg-white'
        headerRowClassName='bg-[#FAFBFC] hover:bg-transparent'
        cellClassName='border-t border-[#F0F2F6]'
        data={params}
        getRowKey={(param) => param.name}
        getRowClassName={() => 'hover:bg-[#F7F8FA]/50'}
        columns={[
          {
            id: 'parameter',
            header: t('Parameter'),
            className: plTh + ' w-44',
            cellClassName: plCell,
            cell: (p) => (
              <div className='flex items-center gap-1.5'>
                <code className='font-mono text-[13px] font-semibold text-[#0A0E1A]'>
                  {p.name}
                </code>
                {p.required && (
                  <span className='inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-rose-600'>
                    {t('required')}
                  </span>
                )}
              </div>
            ),
          },
          {
            id: 'type',
            header: t('Type'),
            className: plTh + ' w-24',
            cellClassName: plCell,
            cell: (p) => (
              <span className='inline-flex items-center rounded-full border border-[#EEF0F4] bg-[#FAFBFC] px-2 py-0.5 font-mono text-[11px] text-[#5A6478]'>
                {p.type}
              </span>
            ),
          },
          {
            id: 'range',
            header: t('Default / range'),
            className: plTh + ' w-40',
            cellClassName: plCell,
            cell: (p) => <ParamRangeCell param={p} />,
          },
          {
            id: 'description',
            header: t('Description'),
            className: plTh,
            cellClassName: plCell,
            cell: (p) => t(p.descriptionKey),
          },
        ]}
      />
    </section>
  )
}

function ParamRangeCell(props: { param: SupportedParameter }) {
  const { defaultValue, range, enumValues } = props.param
  if (defaultValue !== undefined) {
    return (
      <div className='flex flex-wrap items-center gap-1'>
        <span className='text-[13px] text-[#8A93A4]'>=</span>
        <code className='rounded-[6px] bg-[#F7F8FA] px-1.5 py-0.5 font-mono text-[12px] text-[#0A0E1A]'>
          {String(defaultValue)}
        </code>
        {range && (
          <span className='text-[12px] text-[#8A93A4]'>{range}</span>
        )}
      </div>
    )
  }
  if (range) {
    return (
      <span className='font-mono text-[12px] text-[#8A93A4]'>{range}</span>
    )
  }
  if (enumValues && enumValues.length > 0) {
    return (
      <div className='flex flex-wrap gap-1'>
        {enumValues.map((v) => (
          <code
            key={v}
            className='rounded-[6px] bg-[#F7F8FA] px-1.5 py-0.5 font-mono text-[11px] text-[#5A6478]'
          >
            {v}
          </code>
        ))}
      </div>
    )
  }
  return <span className='text-[13px] text-[#B8BFCC]'>—</span>
}

function RateLimitsSection(props: { model: PricingModel }) {
  const { t } = useTranslation()
  const limits = useMemo(() => buildRateLimits(props.model), [props.model])

  if (limits.length === 0) return null

  return (
    <section>
      <SectionTitle icon={Gauge}>{t('Rate limits')}</SectionTitle>
      <StaticDataTable
        className='overflow-hidden rounded-2xl border border-[#E5E8EE] bg-white'
        headerRowClassName='bg-[#FAFBFC] hover:bg-transparent'
        cellClassName='border-t border-[#F0F2F6]'
        data={limits}
        getRowKey={(limit) => limit.group}
        getRowClassName={() => 'hover:bg-[#F7F8FA]/50'}
        columns={[
          {
            id: 'group',
            header: t('Group'),
            className: plTh,
            cellClassName: plCellCode,
            cell: (limit) => limit.group,
          },
          {
            id: 'rpm',
            header: 'RPM',
            className: plTh + ' text-right',
            cellClassName: plCellNum,
            cell: (limit) => formatRateLimit(limit.rpm),
          },
          {
            id: 'tpm',
            header: 'TPM',
            className: plTh + ' text-right',
            cellClassName: plCellNum,
            cell: (limit) => formatRateLimit(limit.tpm),
          },
          {
            id: 'rpd',
            header: 'RPD',
            className: plTh + ' text-right',
            cellClassName: plCellNum,
            cell: (limit) => formatRateLimit(limit.rpd),
          },
        ]}
      />
      <p className='mt-2 pl-font-mono text-[10px] leading-relaxed text-[#B8BFCC]'>
        {t(
          'RPM = requests per minute, TPM = tokens per minute, RPD = requests per day. Limits apply per token group.'
        )}
      </p>
    </section>
  )
}

function AuthSection() {
  const { t } = useTranslation()
  return (
    <section>
      <SectionTitle icon={KeyRound}>{t('Authentication')}</SectionTitle>
      <div className='flex items-start gap-3 rounded-2xl border border-[#E5E8EE] bg-[#FAFBFC] p-4'>
        <ChevronRight className='mt-0.5 size-3.5 shrink-0 text-[#8A93A4]' />
        <div className='space-y-2 text-[13px] leading-relaxed text-[#5A6478]'>
          <p>
            {t('All requests must include')}{' '}
            <code className='rounded-[6px] bg-white px-1.5 py-0.5 font-mono text-[11px] text-[#0A0E1A] ring-1 ring-[#E5E8EE]'>
              Authorization: Bearer &lt;TOKEN&gt;
            </code>{' '}
            {t('header. Anthropic-formatted endpoints accept the')}{' '}
            <code className='rounded-[6px] bg-white px-1.5 py-0.5 font-mono text-[11px] text-[#0A0E1A] ring-1 ring-[#E5E8EE]'>
              x-api-key
            </code>{' '}
            {t('header instead.')}
          </p>
          <p className='text-[#8A93A4]'>
            {t(
              'Generate tokens from the Tokens page; you can scope them to specific models, groups, IPs, and rate-limits.'
            )}
          </p>
        </div>
      </div>
    </section>
  )
}

export function ModelDetailsApi(props: {
  model: PricingModel
  endpointMap: Record<string, { path?: string; method?: string }>
}) {
  return (
    <div className='space-y-6'>
      <CodeSamplesSection model={props.model} endpointMap={props.endpointMap} />
      <AuthSection />
      <SupportedParametersSection model={props.model} />
      <RateLimitsSection model={props.model} />
    </div>
  )
}

function SectionTitle(props: {
  children: React.ReactNode
  icon: React.ComponentType<{ className?: string }>
}) {
  const Icon = props.icon
  return (
    <h3 className='mb-3 flex items-center gap-2 text-[13px] font-semibold text-[#0A0E1A]'>
      <span className='inline-flex size-6 items-center justify-center rounded-full bg-[#F7F8FA]'>
        <Icon className='size-3 text-[#5A6478]' />
      </span>
      {props.children}
    </h3>
  )
}

export { Zap as ApiTabIcon }
