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
import { useQuery } from '@tanstack/react-query'
import { ExternalLink } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { PublicLayout } from '@/components/layout'
import { Footer } from '@/components/layout/components/footer'
import { RichContent } from '@/components/rich-content'
import { useStatus } from '@/hooks/use-status'
import { useSystemConfig } from '@/hooks/use-system-config'
import { isHttpUrl, isLikelyHtml } from '@/lib/content-format'

import { getAboutContent } from './api'

function AboutHero() {
  const { systemName, logo } = useSystemConfig()
  const { status } = useStatus()
  const version = status?.version

  return (
    <section className='relative overflow-hidden pt-28 pb-10'>
      <div className='pl-grid-bg pointer-events-none absolute inset-0 opacity-60' />
      <div className='pl-glow-blue pointer-events-none absolute top-0 right-[-10%] h-[420px] w-[520px]' />
      <div className='pl-glow-green pointer-events-none absolute top-10 left-[-5%] h-[300px] w-[400px]' />
      <div className='relative mx-auto flex w-full max-w-3xl flex-col items-center gap-5 px-6 text-center'>
        <div className='pl-fade-up pl-nav-shadow flex size-20 items-center justify-center overflow-hidden rounded-2xl border border-[#E5E8EE] bg-white/70 backdrop-blur-md'>
          <img src={logo} alt={systemName} className='size-full object-cover' />
        </div>
        <div className='pl-fade-up pl-delay-1'>
          <h1 className='pl-font-display text-[clamp(2rem,4vw,3rem)] leading-[1.1] font-bold tracking-tight text-[#0A0E1A]'>
            {systemName}
          </h1>
          {version && (
            <p className='pl-font-mono mt-2 text-[12px] text-[#8A93A4]'>
              {version}
            </p>
          )}
        </div>
      </div>
    </section>
  )
}

function AboutSkeleton() {
  return (
    <div className='mx-auto w-full max-w-3xl px-6 pb-20'>
      <div className='pl-card p-8'>
        <div className='space-y-4'>
          <div className='pl-skeleton h-7 w-1/3 rounded-md' />
          <div className='pl-skeleton h-3.5 w-full rounded' />
          <div className='pl-skeleton h-3.5 w-[92%] rounded' />
          <div className='pl-skeleton h-3.5 w-[85%] rounded' />
          <div className='pl-skeleton h-3.5 w-[70%] rounded pt-4' />
        </div>
      </div>
    </div>
  )
}

function EmptyAboutState() {
  const { t } = useTranslation()
  const { systemName, logo } = useSystemConfig()
  const currentYear = new Date().getFullYear()

  return (
    <div className='mx-auto w-full max-w-3xl px-6 pb-20'>
      <div className='pl-card p-8 md:p-10'>
        <div className='flex items-center gap-4'>
          <div className='flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#E5E8EE] bg-white/70'>
            <img
              src={logo}
              alt={systemName}
              className='size-full object-cover'
            />
          </div>
          <div className='space-y-1'>
            <h2 className='pl-font-display text-[20px] font-semibold tracking-tight text-[#0A0E1A]'>
              {systemName}
            </h2>
            <p className='text-[13px] text-[#8A93A4]'>
              {t('Unified AI API Gateway')}
            </p>
          </div>
        </div>
        <div className='mt-4 space-y-4'>
          <p className='max-w-xl text-[14px] leading-relaxed text-[#5A6478]'>
            {t(
              'A unified AI API gateway that aggregates 40+ leading AI providers — including OpenAI, Claude, Gemini, Azure, and AWS Bedrock — behind a single OpenAI-compatible API.'
            )}
          </p>
          <ul className='list-disc space-y-2 pl-5 text-[14px] leading-relaxed text-[#5A6478]'>
            <li>
              {t(
                'Unified access to 40+ AI providers through one consistent API'
              )}
            </li>
            <li>{t('Built-in user management, billing, and rate limiting')}</li>
            <li>{t('Admin dashboard with real-time usage analytics')}</li>
          </ul>
        </div>

        <div className='mt-8 border-t border-[#E5E8EE] pt-6'>
          <div className='space-y-3 text-[13px] leading-relaxed text-[#5A6478]'>
            <p>
              {t('New API Project Repository:')}{' '}
              <a
                href='https://github.com/QuantumNous/new-api'
                target='_blank'
                rel='noopener noreferrer'
                className='inline-flex items-center gap-1 font-medium text-[#0A0E1A] underline decoration-[#CBD3E0] decoration-1 underline-offset-[3px] transition-colors hover:text-[#2E4BFF] hover:decoration-[#0A0E1A]'
              >
                https://github.com/QuantumNous/new-api
                <ExternalLink className='h-3 w-3 text-[#8A93A4]' />
              </a>
            </p>
            <p>
              <a
                href='https://github.com/QuantumNous/new-api'
                target='_blank'
                rel='noopener noreferrer'
                className='font-medium text-[#0A0E1A] underline decoration-[#CBD3E0] decoration-1 underline-offset-[3px] transition-colors hover:text-[#2E4BFF] hover:decoration-[#0A0E1A]'
              >
                {t('NewAPI')}
              </a>{' '}
              © {currentYear}{' '}
              <a
                href='https://github.com/QuantumNous'
                target='_blank'
                rel='noopener noreferrer'
                className='underline decoration-[#CBD3E0] decoration-1 underline-offset-[3px] transition-colors hover:text-[#2E4BFF] hover:decoration-[#0A0E1A]'
              >
                {t('QuantumNous')}
              </a>{' '}
              <span className='text-[#8A93A4]'>|</span> {t('Based on')}{' '}
              <a
                href='https://github.com/songquanpeng/one-api'
                target='_blank'
                rel='noopener noreferrer'
                className='underline decoration-[#CBD3E0] decoration-1 underline-offset-[3px] transition-colors hover:text-[#2E4BFF] hover:decoration-[#0A0E1A]'
              >
                {t('One API')}
              </a>{' '}
              © 2023{' '}
              <a
                href='https://github.com/songquanpeng'
                target='_blank'
                rel='noopener noreferrer'
                className='underline decoration-[#CBD3E0] decoration-1 underline-offset-[3px] transition-colors hover:text-[#2E4BFF] hover:decoration-[#0A0E1A]'
              >
                {t('JustSong')}
              </a>
            </p>
            <p>
              {t('This project must be used in compliance with the')}{' '}
              <a
                href='https://github.com/QuantumNous/new-api/blob/main/LICENSE'
                target='_blank'
                rel='noopener noreferrer'
                className='font-medium text-[#0A0E1A] underline decoration-[#CBD3E0] decoration-1 underline-offset-[3px] transition-colors hover:text-[#2E4BFF] hover:decoration-[#0A0E1A]'
              >
                {t('AGPL v3.0 License')}
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function MarkdownAbout({ content }: { content: string }) {
  return (
    <div className='mx-auto w-full max-w-3xl px-6 pb-20'>
      <div className='pl-card p-8 md:p-10'>
        <RichContent
          mode='markdown'
          content={content}
          className='pl-prose prose-neutral max-w-none'
        />
      </div>
    </div>
  )
}

export function About() {
  const { t } = useTranslation()
  const { data, isLoading } = useQuery({
    queryKey: ['about-content'],
    queryFn: getAboutContent,
  })

  const rawContent = data?.data?.trim() ?? ''
  const hasContent = rawContent.length > 0
  const isUrl = hasContent && isHttpUrl(rawContent)
  const contentIsHtml = hasContent && isLikelyHtml(rawContent)

  if (isLoading) {
    return (
      <PublicLayout showMainContainer={false}>
        <AboutHero />
        <AboutSkeleton />
        <Footer />
      </PublicLayout>
    )
  }

  if (!hasContent) {
    return (
      <PublicLayout showMainContainer={false}>
        <AboutHero />
        <EmptyAboutState />
        <Footer />
      </PublicLayout>
    )
  }

  if (isUrl) {
    return (
      <PublicLayout showMainContainer={false}>
        <iframe
          src={rawContent}
          className='h-[calc(100vh-3.5rem)] w-full border-0'
          title={t('About')}
          sandbox='allow-forms allow-popups allow-popups-to-escape-sandbox allow-scripts'
        />
      </PublicLayout>
    )
  }

  if (contentIsHtml) {
    return (
      <PublicLayout showMainContainer={false}>
        <RichContent
          mode='html'
          htmlVariant='isolated'
          content={rawContent}
          className='prose-neutral dark:prose-invert max-w-none'
        />
      </PublicLayout>
    )
  }

  return (
    <PublicLayout showMainContainer={false}>
      <AboutHero />
      <MarkdownAbout content={rawContent} />
      <Footer />
    </PublicLayout>
  )
}
