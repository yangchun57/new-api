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

import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

import type { SystemStatus } from '../types'

interface LegalConsentProps {
  status: SystemStatus | null
  checked: boolean
  onCheckedChange: (nextValue: boolean) => void
  className?: string
}

export function LegalConsent({
  status,
  checked,
  onCheckedChange,
  className,
}: LegalConsentProps) {
  const { t } = useTranslation()
  const hasUserAgreement = Boolean(status?.user_agreement_enabled)
  const hasPrivacyPolicy = Boolean(status?.privacy_policy_enabled)

  if (!hasUserAgreement && !hasPrivacyPolicy) {
    return null
  }

  const handleChange = (value: boolean) => {
    onCheckedChange(value === true)
  }

  const linkCls =
    'font-medium text-[#0A0E1A] underline decoration-[#D8DCE5] underline-offset-[3px] transition-colors hover:decoration-[#0A0E1A]/50'

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-xl border border-[#E5E8EE] bg-[#FAFBFC] px-3.5 py-3',
        className
      )}
    >
      <Checkbox
        id='legal-consent'
        checked={checked}
        onCheckedChange={handleChange}
        className='mt-0.5 size-4 shrink-0 rounded border-[#B8BFCC] shadow-sm transition-colors focus-visible:ring-[#0A0E1A]/15 data-[checked]:border-[#0A0E1A] data-[checked]:bg-[#0A0E1A] data-[checked]:text-white'
      />
      <Label
        htmlFor='legal-consent'
        className='cursor-pointer text-[12px] leading-relaxed font-normal text-[#5A6478]'
      >
        <span>
          {t('I have read and agree to the')}{' '}
          {hasUserAgreement && (
            <a
              href='/user-agreement'
              target='_blank'
              rel='noopener noreferrer'
              className={linkCls}
            >
              {t('User Agreement')}
            </a>
          )}
          {hasUserAgreement && hasPrivacyPolicy && ' ' + t('and') + ' '}
          {hasPrivacyPolicy && (
            <a
              href='/privacy-policy'
              target='_blank'
              rel='noopener noreferrer'
              className={linkCls}
            >
              {t('Privacy Policy')}
            </a>
          )}
          .
        </span>
      </Label>
    </div>
  )
}
