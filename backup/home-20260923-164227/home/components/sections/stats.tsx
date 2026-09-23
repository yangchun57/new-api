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
import { useTranslation } from 'react-i18next'

interface StatsProps {
  className?: string
}

const PROTOCOLS = [
  { method: 'POST', path: '/v1/chat/completions' },
  { method: 'POST', path: '/v1/responses' },
  { method: 'POST', path: '/v1/messages' },
  { method: 'POST', path: '/v1beta/models/{model}:generateContent' },
] as const

export function Stats(_props: StatsProps) {
  const { t } = useTranslation()

  return (
    <div className='border-border/40 bg-muted/10 relative z-10 border-y'>
      <div className='mx-auto max-w-6xl px-6 py-10 md:py-12'>
        <p className='text-muted-foreground mb-6 text-center text-[10px] font-bold tracking-[0.15em] uppercase'>
          {t('Multi-protocol Compatible')}
        </p>
        <div className='border-border/40 bg-border/40 grid grid-cols-1 gap-px overflow-hidden border sm:grid-cols-2 lg:grid-cols-4'>
          {PROTOCOLS.map((proto) => (
            <div
              key={proto.path}
              className='bg-background flex items-center gap-3 px-5 py-4'
            >
              <span className='border border-success/30 bg-success/10 text-success px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-wider uppercase'>
                {proto.method}
              </span>
              <code className='text-foreground/75 truncate font-mono text-xs'>
                {proto.path}
              </code>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
