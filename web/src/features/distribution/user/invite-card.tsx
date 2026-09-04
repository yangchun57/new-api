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
import { Share2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { CopyButton } from '@/components/copy-button'
import { IconBadge } from '@/components/ui/icon-badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { formatQuota } from '@/lib/format'

export interface DistributionSelfStatus {
  inviter_id: number
  inviter_name: string
  distribution_group_id: number
  distribution_debt: number
  distribution_frozen: boolean
}

interface InviteCardProps {
  inviteLink: string
  status: DistributionSelfStatus | null
  loading: boolean
}

export function InviteCard({ inviteLink, status, loading }: InviteCardProps) {
  const { t } = useTranslation()

  if (loading) {
    return (
      <div
        data-slot='card'
        className='group/card bg-card text-card-foreground border-border/70 shadow-card overflow-hidden rounded-xl border'
      >
        <div className='grid gap-4 p-4 sm:p-5'>
          <Skeleton className='h-5 w-32' />
          <Skeleton className='h-4 w-64' />
          <Skeleton className='h-9 rounded-xl' />
        </div>
      </div>
    )
  }

  const frozen = status?.distribution_frozen ?? false
  const debt = status?.distribution_debt ?? 0
  const groupId = status?.distribution_group_id ?? 0

  return (
    <div
      data-slot='card'
      className='group/card bg-card text-card-foreground border-border/70 shadow-card overflow-hidden rounded-xl border'
    >
      <div className='space-y-4 p-4 sm:p-5'>
        <div className='flex items-center gap-2.5'>
          <IconBadge tone='chart-3'>
            <Share2 />
          </IconBadge>
          <div>
            <h3 className='text-[16px] font-semibold text-[#0A0E1A]'>
              {t('My Distribution')}
            </h3>
            <p className='mt-1 text-[13px] text-[#5A6478]'>
              {t(
                'Share your invite link to earn commission from referred users\' consumption.'
              )}
            </p>
          </div>
        </div>

        <div className='flex items-center gap-2'>
          <Input
            value={inviteLink}
            readOnly
            className='h-9 min-w-0 flex-1 font-mono text-[12px]'
          />
          <CopyButton
            value={inviteLink}
            variant='outline'
            className='size-9 shrink-0'
            iconClassName='size-4'
            tooltip={t('Copy invite link')}
            aria-label={t('Copy invite link')}
          />
        </div>

        <div className='grid grid-cols-2 gap-3 sm:grid-cols-4'>
          <div>
            <div className='text-[11px] font-medium uppercase tracking-[0.08em] text-[#8A93A4]'>
              {t('Status')}
            </div>
            <div
              className={`mt-0.5 text-[13px] font-semibold ${
                frozen ? 'text-amber-600' : 'text-emerald-600'
              }`}
            >
              {frozen ? t('Frozen') : t('Active')}
            </div>
          </div>
          <div>
            <div className='text-[11px] font-medium uppercase tracking-[0.08em] text-[#8A93A4]'>
              {t('Debt')}
            </div>
            <div className='mt-0.5 text-[13px] font-semibold tabular-nums text-[#0A0E1A]'>
              {formatQuota(debt)}
            </div>
          </div>
          <div>
            <div className='text-[11px] font-medium uppercase tracking-[0.08em] text-[#8A93A4]'>
              {t('Group ID')}
            </div>
            <div className='mt-0.5 text-[13px] font-semibold tabular-nums text-[#0A0E1A]'>
              {groupId || '-'}
            </div>
          </div>
          <div>
            <div className='text-[11px] font-medium uppercase tracking-[0.08em] text-[#8A93A4]'>
              {t('Inviter')}
            </div>
            <div className='mt-0.5 text-[13px] font-semibold text-[#0A0E1A]'>
              {status?.inviter_name || (status?.inviter_id ? `#${status.inviter_id}` : '-')}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
