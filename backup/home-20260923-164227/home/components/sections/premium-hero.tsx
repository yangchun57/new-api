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
import { CherryStudio } from '@lobehub/icons'
import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'

import { HeroTerminalDemo } from '../hero-terminal-demo'

interface HeroProps {
  className?: string
  isAuthenticated?: boolean
}

const MoreIcon = () => (
  <svg
    className='pl-more-dot size-4 shrink-0 text-[#8a93a4] transition-colors group-hover:text-[#0A0E1A]'
    viewBox='0 0 24 24'
    fill='none'
    xmlns='http://www.w3.org/2000/svg'
  >
    <circle cx='6' cy='12' r='2' fill='currentColor' />
    <circle cx='12' cy='12' r='2' fill='currentColor' />
    <circle cx='18' cy='12' r='2' fill='currentColor' />
  </svg>
)

export function PremiumHero(props: HeroProps) {
  const { t } = useTranslation()

  return (
    <section className='relative isolate overflow-hidden bg-[#F7F8FA] px-6 pt-28 pb-20 md:pt-32 md:pb-24 lg:pt-36 lg:pb-28'>
      {/* Background: 24px grid + blue/green radial glows */}
      <div className='pointer-events-none absolute inset-0 pl-grid-bg opacity-70' />
      <div className='pointer-events-none absolute inset-0 pl-glow-blue' />
      <div className='pointer-events-none absolute inset-0 pl-glow-green' />

      <div className='relative z-10 mx-auto grid max-w-6xl grid-cols-1 items-start gap-12 lg:grid-cols-12 lg:gap-8'>
        {/* Left Column */}
        <div className='flex flex-col items-start text-left lg:col-span-6'>
          {/* Top live pill */}
          <div
            className='pl-fade-up pl-delay-1 mb-5 inline-flex items-center gap-2 rounded-full border border-[#22C55E]/25 bg-[#E8FBF0] px-3 py-1.5 pl-font-mono text-[11px] text-[#16A34A]'
          >
            <span className='relative inline-flex size-1.5 rounded-full bg-[#22C55E] pl-pulse-dot' />
            <span>{t('AI Application Infrastructure Foundation')}</span>
          </div>

          <h1
            className='pl-fade-up pl-delay-2 pl-font-display text-[clamp(2.25rem,4.5vw,3.25rem)] leading-[1.12] font-bold tracking-tight text-[#0A0E1A]'
          >
            {t('Unified API Gateway for')}
            <br />
            <span className='pl-font-serif-italic'>
              {t('Vast Range of AI Models')}
            </span>
          </h1>
          <p
            className='pl-fade-up pl-delay-3 mt-5 max-w-xl text-[15px] leading-relaxed text-[#5A6478]'
          >
            {t(
              'Access a vast selection of models via a standard, unified API protocol. Power AI applications, manage digital assets, and connect the Future.'
            )}
          </p>

          {/* CTAs — same count/order/text as original Hero */}
          <div
            className='pl-fade-up pl-delay-4 mt-8 flex flex-wrap items-center gap-3'
          >
            {props.isAuthenticated ? (
              <>
                <Button
                  className='group inline-flex h-11 items-center gap-1.5 rounded-full bg-[#0A0E1A] px-5 pl-font-display text-[13px] font-semibold text-white pl-cta-primary hover:bg-[#0A0E1A]/90'
                  render={<Link to='/dashboard' />}
                >
                  {t('Go to Dashboard')}
                  <ArrowRight className='ml-1 size-4 transition-transform duration-200 group-hover:translate-x-0.5' />
                </Button>
              </>
            ) : (
              <>
                <Button
                  className='group inline-flex h-11 items-center gap-1.5 rounded-full bg-[#0A0E1A] px-5 pl-font-display text-[13px] font-semibold text-white pl-cta-primary hover:bg-[#0A0E1A]/90'
                  render={<Link to='/sign-up' />}
                >
                  {t('Get Started')}
                  <ArrowRight className='ml-1 size-4 transition-transform duration-200 group-hover:translate-x-0.5' />
                </Button>
                <Button
                  variant='outline'
                  className='pl-cta-secondary inline-flex h-11 items-center gap-1.5 rounded-full border border-[#E5E8EE] bg-white px-5 pl-font-display text-[13px] font-semibold text-[#0A0E1A] hover:bg-[#F7F8FA]'
                  render={<Link to='/pricing' />}
                >
                  {t('View Pricing')}
                </Button>
              </>
            )}
          </div>

          {/* Supported Apps — same 3 tiles, same copy/links as original */}
          <div
            className='pl-fade-up pl-delay-5 mt-10 w-full max-w-xl'
          >
            <div className='mb-4 flex flex-col gap-1'>
              <span className='pl-font-mono text-[10px] text-[#5A6478]'>
                {t('Supported Applications')}
              </span>
              <p className='text-[12px] leading-relaxed text-[#8a93a4]'>
                {t(
                  'Supports one-click configuration and perfectly adapts to NewAPI multi-protocol configuration.'
                )}
              </p>
            </div>
            <div className='flex flex-wrap items-center gap-3'>
              <a
                href='https://cherry-ai.com'
                target='_blank'
                rel='noopener noreferrer'
                className='group inline-flex items-center gap-3 rounded-full border border-[#E5E8EE] bg-white px-5 py-2.5 pl-nav-shadow text-[13px] font-medium text-[#0A0E1A] transition-colors duration-200 hover:border-[#0A0E1A] hover:bg-white'
              >
                <CherryStudio.Color size={22} className='shrink-0' />
                <span>Cherry Studio</span>
              </a>

              <a
                href='https://ccswitch.io'
                target='_blank'
                rel='noopener noreferrer'
                className='group inline-flex items-center gap-3 rounded-full border border-[#E5E8EE] bg-white px-5 py-2.5 pl-nav-shadow text-[13px] font-medium text-[#0A0E1A] transition-colors duration-200 hover:border-[#0A0E1A] hover:bg-white'
              >
                <img
                  src='https://ccswitch.io/favicon.png'
                  alt='CC Switch'
                  className='size-5 shrink-0 object-contain'
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                    const fallback = e.currentTarget.nextSibling as HTMLElement
                    if (fallback) fallback.style.display = 'flex'
                  }}
                />
                <span
                  style={{ display: 'none' }}
                  className='inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-[#E8FBF0] pl-font-mono text-[9px] text-[#16A34A]'
                >
                  CC
                </span>
                <span>CC Switch</span>
              </a>

              <div className='group inline-flex cursor-default items-center gap-2 rounded-full border border-[#E5E8EE] bg-white px-5 py-2.5 pl-nav-shadow text-[13px] font-medium text-[#5A6478] transition-colors duration-200 hover:border-[#0A0E1A] hover:bg-white hover:text-[#0A0E1A]'>
                <MoreIcon />
                <span>{t('More Apps')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: original terminal demo, wrapped in a premium card shell */}
        <div
          className='pl-fade-up pl-delay-6 flex w-full justify-center lg:col-span-6'
        >
          <div className='relative mt-8 w-full max-w-[520px] lg:mt-0'>
            <div className='relative overflow-hidden rounded-[16px] border border-[#E5E8EE] bg-white pl-nav-shadow'>
              <HeroTerminalDemo className='w-full' />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
