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

import { AnimateInView } from '@/components/animate-in-view'

export function HowItWorks() {
  const { t } = useTranslation()

  const steps = [
    {
      command: 'configure',
      title: t('Configure'),
      desc: t(
        'Add your API keys, set up channels and configure access permissions'
      ),
    },
    {
      command: 'connect',
      title: t('Connect'),
      desc: t(
        'Connect through OpenAI, Claude, Gemini, and other compatible API routes'
      ),
    },
    {
      command: 'monitor',
      title: t('Monitor'),
      desc: t('Track usage, costs and performance with real-time analytics'),
    },
  ]

  return (
    <section className='border-border/40 relative z-10 border-t px-6 py-24 md:py-32'>
      <div className='mx-auto max-w-3xl'>
        <AnimateInView className='mb-12 text-center'>
          <p className='text-muted-foreground text-xs font-medium tracking-widest uppercase'>
            {t('How It Works')}
          </p>
        </AnimateInView>

        <AnimateInView className='overflow-hidden rounded-none border border-border/40 bg-muted/10'>
          <div className='border-border/40 bg-background flex items-center gap-2 border-b px-5 py-3'>
            <span className='inline-block size-1.5 rounded-full bg-success' />
            <span className='text-foreground/40 font-mono text-[10px] tracking-wider uppercase'>
              new-api · gateway log
            </span>
          </div>
          <div className='divide-border/40 divide-y font-mono text-sm'>
            {steps.map((step) => (
              <div key={step.command} className='px-5 py-5'>
                <div className='flex items-baseline gap-3'>
                  <span className='text-success'>$</span>
                  <span className='text-foreground font-medium'>
                    new-api {step.command}
                  </span>
                  <span className='text-muted-foreground text-xs'>
                    {step.title}
                  </span>
                </div>
                <p className='text-muted-foreground mt-2 pl-6 text-xs leading-relaxed'>
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </AnimateInView>
      </div>
    </section>
  )
}
