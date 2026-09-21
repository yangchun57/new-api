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
import { useTranslation } from 'react-i18next'

import { Dialog } from '@/components/dialog'
import { StatusBadge } from '@/components/status-badge'
import { Skeleton } from '@/components/ui/skeleton'
import { formatTimestampToDate } from '@/lib/format'

import { getAllChatLogs } from '../api'
import { getChatLogRoleVariant } from '../constants'
import type { ChatLog, ChatLogAttachment } from '../types'

const MAX_MESSAGES = 200

function AttachmentList({ attachments }: { attachments: ChatLogAttachment[] }) {
  return (
    <div className='flex flex-col gap-2'>
      {attachments.map((attachment, index) => {
        const type = attachment.type
        const key = attachment.url || attachment.file_name || `${type}-${index}`
        if (type === 'image' && attachment.url) {
          return (
            <img
              key={key}
              src={attachment.url}
              alt={attachment.file_name || 'image'}
              className='max-h-64 w-auto max-w-full rounded-lg border border-[#E5E8EE] object-contain'
            />
          )
        }
        if (type === 'audio' && attachment.url) {
          return (
            <audio key={key} controls src={attachment.url} className='w-full' />
          )
        }
        if (type === 'video' && attachment.url) {
          return (
            <video
              key={key}
              controls
              src={attachment.url}
              className='max-h-64 w-auto max-w-full rounded-lg'
            />
          )
        }
        const label = attachment.file_name || attachment.type
        if (attachment.url) {
          return (
            <a
              key={key}
              href={attachment.url}
              target='_blank'
              rel='noreferrer'
              className='text-[13px] break-all text-[#3B82F6] underline'
            >
              {label}
            </a>
          )
        }
        return (
          <span key={key} className='text-[13px] break-all text-[#5A6478]'>
            {label}
          </span>
        )
      })}
    </div>
  )
}

function MessageBlock({ log }: { log: ChatLog }) {
  const { t } = useTranslation()
  const hasTokens = log.prompt_tokens > 0 || log.completion_tokens > 0

  return (
    <div className='min-w-0 space-y-1.5 rounded-xl border border-[#E5E8EE] bg-white p-3'>
      <div className='flex flex-wrap items-center gap-2'>
        <StatusBadge
          label={log.role}
          variant={getChatLogRoleVariant(log.role)}
          size='sm'
          copyable={false}
        />
        <span className='text-[11px] text-[#8A93A4] tabular-nums'>
          #{log.seq}
        </span>
        {hasTokens && (
          <span className='ml-auto text-[11px] text-[#8A93A4] tabular-nums'>
            {log.prompt_tokens.toLocaleString()} /{' '}
            {log.completion_tokens.toLocaleString()}
          </span>
        )}
      </div>
      {log.content && (
        <p className='min-w-0 font-mono text-[12px] leading-relaxed break-all whitespace-pre-wrap text-[#5A6478] sm:wrap-break-word'>
          {log.content}
        </p>
      )}
      {log.attachments && log.attachments.length > 0 && (
        <div className='space-y-1'>
          <span className='text-[11px] text-[#8A93A4]'>{t('Attachments')}</span>
          <AttachmentList attachments={log.attachments} />
        </div>
      )}
    </div>
  )
}

function Hint({ text }: { text: string }) {
  return <p className='py-8 text-center text-[13px] text-[#8A93A4]'>{text}</p>
}

function ConversationSkeleton() {
  return (
    <div className='space-y-2.5'>
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className='space-y-2 rounded-xl border border-[#E5E8EE] bg-white p-3'
        >
          <Skeleton className='h-5 w-24 rounded-md' />
          <Skeleton className='h-4 w-full rounded' />
          <Skeleton className='h-4 w-2/3 rounded' />
        </div>
      ))}
    </div>
  )
}

interface ConversationRecordDialogProps {
  requestId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ConversationRecordDialog({
  requestId,
  open,
  onOpenChange,
}: ConversationRecordDialogProps) {
  const { t } = useTranslation()
  const { data, isLoading, isError } = useQuery({
    queryKey: ['chat-log-conversation', requestId],
    queryFn: async () => {
      const res = await getAllChatLogs({
        request_id: requestId ?? '',
        page_size: MAX_MESSAGES,
      })
      return res.data?.items ?? []
    },
    enabled: open && Boolean(requestId),
    staleTime: 60_000,
  })

  const logs = [...(data ?? [])].sort((a, b) => a.seq - b.seq)
  const first = logs[0]

  // conversation_id 只在客户端请求头带了 X-Conversation-Id 时才有值，为空则不展示。
  const meta: { label: string; value: string }[] = []
  if (first?.conversation_id) {
    meta.push({ label: t('Conversation ID'), value: first.conversation_id })
  }
  if (first?.request_id) {
    meta.push({ label: t('Request ID'), value: first.request_id })
  }
  if (first?.token_name) {
    meta.push({ label: t('Token'), value: first.token_name })
  }
  if (first?.group) {
    meta.push({ label: t('Group'), value: first.group })
  }

  let body = (
    <div className='space-y-2.5'>
      {meta.length > 0 && (
        <div className='grid gap-1 rounded-xl border border-[#E5E8EE] bg-[#F7F8FA] p-3 text-[12px]'>
          {meta.map((item) => (
            <div key={item.label} className='flex min-w-0 gap-2'>
              <span className='w-24 shrink-0 text-[#8A93A4]'>{item.label}</span>
              <span className='min-w-0 font-mono break-all text-[#5A6478]'>
                {item.value}
              </span>
            </div>
          ))}
        </div>
      )}
      {logs.map((log) => (
        <MessageBlock key={log.id} log={log} />
      ))}
    </div>
  )
  if (isLoading) {
    body = <ConversationSkeleton />
  } else if (isError) {
    body = <Hint text={t('Failed to load chat logs')} />
  } else if (logs.length === 0) {
    body = <Hint text={t('No Conversation Records Found')} />
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('Conversation Records')}
      description={
        first
          ? `${formatTimestampToDate(first.created_at)} · ${first.model_name}`
          : t('View the complete content and metadata for this record')
      }
      contentClassName='max-sm:max-h-[calc(100dvh-1.5rem)] max-sm:w-[calc(100vw-1.5rem)] max-sm:max-w-[calc(100vw-1.5rem)] max-sm:p-4 sm:max-w-2xl'
      headerClassName='max-sm:gap-1'
      titleClassName='text-base'
      descriptionClassName='text-[12px]'
      contentHeight='min(72dvh, 720px)'
      bodyClassName='pr-2 sm:pr-4'
    >
      {body}
    </Dialog>
  )
}
