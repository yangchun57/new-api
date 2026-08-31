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
import { isHttpUrl, isLikelyHtml } from '@/lib/content-format'

import { getAboutContent } from './api'

function AboutHero() {
  const { t } = useTranslation()
  return (
    <section className='relative overflow-hidden pt-28 pb-10'>
      <div className='pointer-events-none absolute inset-0 pl-grid-bg opacity-60' />
      <div className='pointer-events-none absolute top-0 right-[-10%] h-[420px] w-[520px] pl-glow-blue' />
      <div className='pointer-events-none absolute top-10 left-[-5%] h-[300px] w-[400px] pl-glow-green' />
      <div className='relative mx-auto w-full max-w-3xl px-6 text-center'>
        <span className='pl-fade-up pl-font-mono mb-5 inline-block rounded-full border border-[#E5E8EE] bg-white/70 px-3 py-1 text-[11px] text-[#5A6478] pl-nav-shadow backdrop-blur-md'>
          {t('About')}
        </span>
        <h1 className='pl-fade-up pl-delay-1 pl-font-display text-[clamp(2rem,4vw,3rem)] leading-[1.1] font-bold tracking-tight text-[#0A0E1A]'>
          {t('About')}
        </h1>
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
          <div className='pt-4 pl-skeleton h-3.5 w-[70%] rounded' />
        </div>
      </div>
    </div>
  )
}

function EmptyAboutState() {
  const { t } = useTranslation()
  const currentYear = new Date().getFullYear()

  return (
    <div className='mx-auto w-full max-w-3xl px-6 pb-20'>
      <div className='pl-card p-8 md:p-10'>
        <div className='space-y-2'>
          <h2 className='pl-font-display text-[20px] font-semibold tracking-tight text-[#0A0E1A]'>
            {t('No About Content Set')}
          </h2>
          <p className='max-w-xl text-[14px] leading-relaxed text-[#5A6478]'>
            {t(
              'The administrator has not configured any about content yet. You can set it in the settings page, supporting HTML or URL.'
            )}
          </p>
        </div>

        <div className='mt-8 border-t border-[#E5E8EE] pt-6'>
          <div className='space-y-3 text-[13px] leading-relaxed text-[#5A6478]'>
            <p>
              {t('New API Project Repository:')}{' '}
              <a
                href='https://github.com/QuantumNous/new-api'
                target='_blank'
                rel='noopener noreferrer'
                className='inline-flex items-center gap-1 font-medium text-[#0A0E1A] underline decoration-[#CBD3E0] decoration-1 underline-offset-[3px] transition-colors hover:decoration-[#0A0E1A] hover:text-[#2E4BFF]'
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
                className='font-medium text-[#0A0E1A] underline decoration-[#CBD3E0] decoration-1 underline-offset-[3px] transition-colors hover:decoration-[#0A0E1A] hover:text-[#2E4BFF]'
              >
                {t('NewAPI')}
              </a>{' '}
              © {currentYear}{' '}
              <a
                href='https://github.com/QuantumNous'
                target='_blank'
                rel='noopener noreferrer'
                className='underline decoration-[#CBD3E0] decoration-1 underline-offset-[3px] transition-colors hover:decoration-[#0A0E1A] hover:text-[#2E4BFF]'
              >
                {t('QuantumNous')}
              </a>{' '}
              <span className='text-[#8A93A4]'>|</span>{' '}
              {t('Based on')}{' '}
              <a
                href='https://github.com/songquanpeng/one-api'
                target='_blank'
                rel='noopener noreferrer'
                className='underline decoration-[#CBD3E0] decoration-1 underline-offset-[3px] transition-colors hover:decoration-[#0A0E1A] hover:text-[#2E4BFF]'
              >
                {t('One API')}
              </a>{' '}
              © 2023{' '}
              <a
                href='https://github.com/songquanpeng'
                target='_blank'
                rel='noopener noreferrer'
                className='underline decoration-[#CBD3E0] decoration-1 underline-offset-[3px] transition-colors hover:decoration-[#0A0E1A] hover:text-[#2E4BFF]'
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
                className='font-medium text-[#0A0E1A] underline decoration-[#CBD3E0] decoration-1 underline-offset-[3px] transition-colors hover:decoration-[#0A0E1A] hover:text-[#2E4BFF]'
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
