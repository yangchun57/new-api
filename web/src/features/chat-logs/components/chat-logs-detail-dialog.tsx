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
import { Copy, Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Dialog } from '@/components/dialog'
import { StatusBadge } from '@/components/status-badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard'
import { formatTimestampToDate } from '@/lib/format'

import { getChatLogRoleVariant } from '../constants'
import type { ChatLog } from '../types'
import { useChatLogs } from './chat-logs-provider'

function DetailRow(props: {
  label: React.ReactNode
  value: React.ReactNode
  mono?: boolean
}) {
  return (
    <div className='grid min-w-0 grid-cols-[5.5rem_minmax(0,1fr)] gap-2 sm:grid-cols-[7rem_minmax(0,1fr)] sm:gap-3'>
      <span className='min-w-0 text-[11px] text-[#8A93A4]'>{props.label}</span>
      <span
        className={`max-w-full min-w-0 text-[13px] break-all sm:wrap-break-word text-[#0A0E1A] ${
          props.mono ? 'font-mono' : ''
        }`}
      >
        {props.value}
      </span>
    </div>
  )
}

export function ChatLogsDetailDialog() {
  const { t } = useTranslation()
  const { currentRow, setCurrentRow } = useChatLogs()
  const { copiedText, copyToClipboard } = useCopyToClipboard({ notify: false })
  const log: ChatLog | null = currentRow

  const content = log?.content ?? ''

  return (
    <Dialog
      open={log !== null}
      onOpenChange={(open) => {
        if (!open) setCurrentRow(null)
      }}
      title={
        <>
          {t('Conversation Record')}
          {log && (
            <StatusBadge
              label={log.role}
              variant={getChatLogRoleVariant(log.role)}
              size='sm'
              copyable={false}
            />
          )}
        </>
      }
      description={t('View the complete content and metadata for this record')}
      contentClassName='max-sm:max-h-[calc(100dvh-1.5rem)] max-sm:w-[calc(100vw-1.5rem)] max-sm:max-w-[calc(100vw-1.5rem)] max-sm:p-4 sm:max-w-lg'
      headerClassName='max-sm:gap-1'
      titleClassName='flex items-center gap-2 text-base'
      descriptionClassName='sr-only'
      contentHeight='min(72dvh, 720px)'
      bodyClassName='pr-2 sm:pr-4'
    >
      {log && (
        <div className='w-full max-w-full min-w-0 space-y-2.5 overflow-x-hidden py-1 sm:space-y-3'>
          <div className='min-w-0 space-y-1'>
            <DetailRow
              label={t('Time')}
              value={formatTimestampToDate(log.created_at)}
            />
            <DetailRow label={t('Model')} value={log.model_name} mono />
            <DetailRow label={t('Seq')} value={String(log.seq)} mono />
            <DetailRow
              label={t('Prompt')}
              value={log.prompt_tokens > 0 ? log.prompt_tokens.toLocaleString() : '-'}
              mono
            />
            <DetailRow
              label={t('Completion')}
              value={
                log.completion_tokens > 0
                  ? log.completion_tokens.toLocaleString()
                  : '-'
              }
              mono
            />
            {log.request_id && (
              <DetailRow label={t('Request ID')} value={log.request_id} mono />
            )}
            {log.conversation_id && (
              <DetailRow
                label={t('Conversation ID')}
                value={log.conversation_id}
                mono
              />
            )}
            {log.token_name && (
              <DetailRow label={t('Token')} value={log.token_name} mono />
            )}
            {log.group && (
              <DetailRow label={t('Group')} value={log.group} mono />
            )}
            {log.latency_ms > 0 && (
              <DetailRow
                label={t('Latency')}
                value={`${log.latency_ms}ms`}
                mono
              />
            )}
          </div>

          <div className='space-y-1.5'>
            <Label className='text-[13px] font-medium text-[#0A0E1A]'>
              {t('Content')}
            </Label>
            <div className='bg-[#F7F8FA] relative min-w-0 overflow-hidden rounded-xl border border-[#E5E8EE] p-4'>
              {content && (
                <Button
                  variant='ghost'
                  size='sm'
                  className='absolute top-2 right-2 h-7 w-7 p-0'
                  onClick={() => copyToClipboard(content)}
                  title={t('Copy to clipboard')}
                  aria-label={t('Copy to clipboard')}
                >
                  {copiedText === content ? (
                    <Check className='size-3.5 text-[#16A34A]' />
                  ) : (
                    <Copy className='size-3.5' />
                  )}
                </Button>
              )}
              <p className='min-w-0 pr-8 font-mono text-[12px] leading-relaxed break-all text-[#5A6478] whitespace-pre-wrap sm:wrap-break-word'>
                {content || t('No content')}
              </p>
            </div>
          </div>
        </div>
      )}
    </Dialog>
  )
}
