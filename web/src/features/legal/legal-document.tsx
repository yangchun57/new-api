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
import { ExternalLink, FileText } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { PublicLayout } from '@/components/layout'
import { Footer } from '@/components/layout/components/footer'
import { RichContent } from '@/components/rich-content'
import { Button } from '@/components/ui/button'
import { isHttpUrl, isLikelyHtml } from '@/lib/content-format'

import type { LegalDocumentResponse } from './types'

type LegalDocumentProps = {
  title: string
  queryKey: string
  fetchDocument: () => Promise<LegalDocumentResponse>
  emptyMessage: string
}

function DocumentHero(props: { title: string }) {
  return (
    <section className='relative overflow-hidden pt-28 pb-10'>
      <div className='pointer-events-none absolute inset-0 pl-grid-bg opacity-60' />
      <div className='pointer-events-none absolute top-0 right-[-10%] h-[420px] w-[520px] pl-glow-blue' />
      <div className='pointer-events-none absolute top-10 left-[-5%] h-[300px] w-[400px] pl-glow-green' />
      <div className='relative mx-auto w-full max-w-3xl px-6 text-center'>
        <h1 className='pl-fade-up pl-delay-1 pl-font-display text-[clamp(2rem,4vw,3rem)] leading-[1.1] font-bold tracking-tight text-[#0A0E1A]'>
          {props.title}
        </h1>
      </div>
    </section>
  )
}

function DocumentSkeleton() {
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

function EmptyDocument(props: { title: string; message: string }) {
  return (
    <div className='mx-auto w-full max-w-3xl px-6 pb-20'>
      <div className='pl-card p-8 md:p-10'>
        <div className='flex flex-col items-start gap-4 rounded-xl border border-dashed border-[#E5E8EE] bg-[#FAFBFC] p-6'>
          <div className='flex h-9 w-9 items-center justify-center rounded-lg border border-[#E5E8EE] bg-white'>
            <FileText className='h-4 w-4 text-[#5A6478]' />
          </div>
          <div className='space-y-1'>
            <p className='pl-font-display text-[15px] font-semibold text-[#0A0E1A]'>
              {props.title}
            </p>
            <p className='text-[14px] leading-relaxed text-[#5A6478]'>
              {props.message}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function ExternalLinkDocument(props: { title: string; url: string }) {
  const { t } = useTranslation()
  return (
    <div className='mx-auto w-full max-w-3xl px-6 pb-20'>
      <div className='pl-card p-8 md:p-10'>
        <div className='flex flex-col gap-6 md:flex-row md:items-center md:justify-between'>
          <div className='space-y-2'>
            <h2 className='pl-font-display text-[20px] font-semibold tracking-tight text-[#0A0E1A]'>
              {props.title}
            </h2>
            <p className='max-w-xl text-[14px] leading-relaxed text-[#5A6478]'>
              {t(
                'The administrator configured an external link for this document.'
              )}
            </p>
          </div>
          <Button
            render={
              <a
                href={props.url}
                target='_blank'
                rel='noopener noreferrer'
                className='inline-flex items-center gap-1.5 rounded-full bg-[#0A0E1A] px-5 py-2.5 pl-font-mono text-[12px] font-medium text-white pl-nav-shadow transition-all duration-200 hover:bg-[#1a2035] hover:shadow-[0_6px_20px_rgba(10,14,26,0.2)]'
              />
            }
          >
            {t('View document')}
            <ExternalLink className='h-3 w-3' />
          </Button>
        </div>
      </div>
    </div>
  )
}

function MarkdownDocument(props: { content: string }) {
  return (
    <div className='mx-auto w-full max-w-3xl px-6 pb-20'>
      <div className='pl-card p-8 md:p-10'>
        <RichContent
          mode='markdown'
          content={props.content}
          className='pl-prose max-w-none'
        />
      </div>
    </div>
  )
}

export function LegalDocument({
  title,
  queryKey,
  fetchDocument,
  emptyMessage,
}: LegalDocumentProps) {
  const { t } = useTranslation()
  const { data, isLoading } = useQuery({
    queryKey: [queryKey],
    queryFn: fetchDocument,
    staleTime: 10 * 60 * 1000,
  })

  const rawContent = data?.data?.trim() ?? ''
  const hasContent = rawContent.length > 0
  const isUrl = hasContent && isHttpUrl(rawContent)
  const contentIsHtml = hasContent && isLikelyHtml(rawContent)
  const success = data?.success ?? false

  if (isLoading) {
    return (
      <PublicLayout showMainContainer={false}>
        <DocumentHero title={title} />
        <DocumentSkeleton />
        <Footer />
      </PublicLayout>
    )
  }

  if (!success || !hasContent) {
    return (
      <PublicLayout showMainContainer={false}>
        <DocumentHero title={title} />
        <EmptyDocument
          title={title}
          message={data?.message || emptyMessage}
        />
        <Footer />
      </PublicLayout>
    )
  }

  if (isUrl) {
    return (
      <PublicLayout showMainContainer={false}>
        <DocumentHero title={title} />
        <ExternalLinkDocument title={title} url={rawContent} />
        <Footer />
      </PublicLayout>
    )
  }

  if (contentIsHtml) {
    return (
      <PublicLayout showMainContainer={false}>
        <RichContent mode='html' htmlVariant='isolated' content={rawContent} />
      </PublicLayout>
    )
  }

  return (
    <PublicLayout showMainContainer={false}>
      <DocumentHero title={title} />
      <MarkdownDocument content={rawContent} />
      <Footer />
    </PublicLayout>
  )
}
