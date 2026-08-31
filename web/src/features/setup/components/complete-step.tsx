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
import { CheckCircle2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { StatusBadge } from '@/components/status-badge'

import type { SetupFormValues, SetupStatus } from '../types'

interface CompleteStepProps {
  status?: SetupStatus
  values: SetupFormValues
}

const USAGE_MODE_LABEL_KEYS: Record<SetupFormValues['usageMode'], string> = {
  external: 'External operations mode',
  self: 'Personal use mode',
  demo: 'Demo site mode',
}

const DATABASE_VARIANT: Record<
  string,
  'info' | 'success' | 'warning' | 'neutral'
> = {
  sqlite: 'warning',
  mysql: 'success',
  postgres: 'success',
}

const rowCls = 'py-4 first:pt-0 last:pb-0'
const dtCls =
  'text-[11px] font-medium uppercase tracking-[0.14em] text-[#8A93A4]'
const ddCls = 'mt-1.5 flex flex-wrap items-center gap-2 text-[14px] font-medium text-[#0A0E1A]'

export function CompleteStep({ status, values }: CompleteStepProps) {
  const { t } = useTranslation()
  const usageLabelKey = USAGE_MODE_LABEL_KEYS[values.usageMode]
  const dbType = status?.database_type ?? 'Unknown'
  const databaseVariant = DATABASE_VARIANT[dbType.toLowerCase()] ?? 'neutral'

  return (
    <div className='flex flex-col items-center gap-6 text-center'>
      <div className='flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-200/80 bg-emerald-50/70 text-emerald-600 shadow-sm'>
        <CheckCircle2 className='h-7 w-7' strokeWidth={1.75} />
      </div>
      <div className='space-y-2'>
        <h2 className='text-[22px] font-semibold tracking-tight text-[#0A0E1A]'>
          {t('Ready to initialize')}
        </h2>
        <p className='mx-auto max-w-lg text-[14px] leading-relaxed text-[#5A6478]'>
          {t(
            'Double check the configuration below. Your system will be locked until initialization is complete.'
          )}
        </p>
      </div>

      <div className='w-full rounded-xl border border-[#E5E8EE] bg-white p-6 text-left shadow-sm sm:p-7'>
        <dl className='divide-y divide-[#E5E8EE]'>
          <div className={rowCls}>
            <dt className={dtCls}>{t('Database')}</dt>
            <dd className={ddCls}>
              <span>{dbType}</span>
              <StatusBadge
                label={dbType}
                variant={databaseVariant}
                copyable={false}
              />
            </dd>
          </div>

          <div className={rowCls}>
            <dt className={dtCls}>{t('Administrator account')}</dt>
            <dd className={ddCls}>
              {status?.root_init
                ? t('Existing account will be reused')
                : values.username || t('Not set yet')}
            </dd>
          </div>

          <div className={rowCls}>
            <dt className={dtCls}>{t('Usage mode')}</dt>
            <dd className={ddCls}>{t(usageLabelKey)}</dd>
          </div>
        </dl>
      </div>
    </div>
  )
}
