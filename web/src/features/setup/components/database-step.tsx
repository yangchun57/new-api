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
import { Database, HardDrive, Server } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { StatusBadge } from '@/components/status-badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

import type { SetupStatus } from '../types'

interface DatabaseStepProps {
  status?: SetupStatus
}

const DATABASE_META: Record<
  string,
  {
    label: string
    descriptionKey: string
    variant: 'info' | 'success' | 'warning'
  }
> = {
  sqlite: {
    label: 'SQLite',
    descriptionKey:
      'SQLite stores all data in a single file. Make sure that file is persisted when running in containers.',
    variant: 'warning',
  },
  mysql: {
    label: 'MySQL',
    descriptionKey:
      'MySQL is a production-ready relational database. Keep your credentials secure.',
    variant: 'success',
  },
  postgres: {
    label: 'PostgreSQL',
    descriptionKey:
      'PostgreSQL offers advanced reliability and data integrity for production workloads.',
    variant: 'success',
  },
}

function resolveDatabaseMeta(type?: string) {
  if (!type) return null
  const normalized = type.toLowerCase()
  return (
    DATABASE_META[normalized] ?? {
      label: type,
      descriptionKey: 'Custom database driver detected.',
      variant: 'info' as const,
    }
  )
}

const alertBase = 'rounded-xl px-4 py-3 [&>svg]:mt-0.5'
const alertTitleCls = 'text-[13px] font-semibold'
const alertDescCls = 'mt-1 text-[13px] leading-relaxed opacity-90'

export function DatabaseStep({ status }: DatabaseStepProps) {
  const { t } = useTranslation()
  const meta = resolveDatabaseMeta(status?.database_type)
  const electronApi =
    typeof window !== 'undefined'
      ? ((window as unknown as Record<string, unknown>)?.electron as
          | Record<string, unknown>
          | undefined)
      : undefined
  const isElectron = Boolean(electronApi?.isElectron)
  const electronDataDir = electronApi?.dataDir as string | undefined

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between rounded-xl border border-[#E5E8EE] bg-[#FAFBFC] p-4'>
        <div className='min-w-0 space-y-1 pr-4'>
          <p className='text-[11px] font-medium uppercase tracking-[0.14em] text-[#8A93A4]'>
            {t('Detected database')}
          </p>
          <p className='text-[15px] font-semibold text-[#0A0E1A]'>
            {meta?.label ?? t('Unknown')}
          </p>
          <p className='text-[13px] leading-relaxed text-[#5A6478]'>
            {t(
              meta?.descriptionKey ??
                'The setup wizard will use this database during initialization.'
            )}
          </p>
        </div>
        <StatusBadge
          label={meta?.label ?? t('Unknown')}
          variant={meta?.variant ?? 'info'}
          className='cursor-default shrink-0'
          copyable={false}
          icon={Database}
        />
      </div>

      {status?.database_type === 'sqlite' && (
        <Alert
          className={`${alertBase} border-amber-200/80 bg-amber-50/60 text-amber-800`}
        >
          <AlertTitle className={`${alertTitleCls} flex items-center gap-2 text-amber-800`}>
            <HardDrive className='h-4 w-4 text-amber-500' />
            {t('Persist your data file')}
          </AlertTitle>
          <AlertDescription className={`${alertDescCls} text-amber-700/90`}>
            <p>
              {t(
                'When running in containers or ephemeral environments, ensure the SQLite file is mapped to persistent storage to avoid data loss on restart.'
              )}
            </p>
            {isElectron && electronDataDir && (
              <p className='mt-3 rounded-md bg-amber-100/80 px-3 py-2 font-mono text-[12px] text-amber-800'>
                {t('Data directory:')} {electronDataDir}
              </p>
            )}
            {isElectron && !electronDataDir && (
              <p className='mt-3 text-[12px] text-amber-700/80'>
                {t(
                  'Data is stored locally on this device. Use system backups to keep a safe copy.'
                )}
              </p>
            )}
          </AlertDescription>
        </Alert>
      )}

      {status?.database_type === 'mysql' && (
        <Alert
          className={`${alertBase} border-emerald-200/80 bg-emerald-50/60 text-emerald-800`}
        >
          <AlertTitle
            className={`${alertTitleCls} flex items-center gap-2 text-emerald-800`}
          >
            <Server className='h-4 w-4 text-emerald-500' />
            {t('MySQL detected')}
          </AlertTitle>
          <AlertDescription className={`${alertDescCls} text-emerald-700/90`}>
            {t(
              'MySQL is production ready. Ensure automated backups and a dedicated user with the minimal required privileges are configured.'
            )}
          </AlertDescription>
        </Alert>
      )}

      {status?.database_type === 'postgres' && (
        <Alert className={`${alertBase} border-sky-200/80 bg-sky-50/60 text-sky-800`}>
          <AlertTitle className={`${alertTitleCls} flex items-center gap-2 text-sky-800`}>
            <Server className='h-4 w-4 text-sky-500' />
            {t('PostgreSQL detected')}
          </AlertTitle>
          <AlertDescription className={`${alertDescCls} text-sky-700/90`}>
            {t(
              'PostgreSQL offers strong reliability guarantees. Double check your maintenance window and retention policies before going live.'
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
