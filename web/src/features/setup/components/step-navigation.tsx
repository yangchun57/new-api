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
import { CheckCircle2, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'

const btnBase = 'h-10 rounded-xl px-5 text-[13px] font-medium transition-colors shadow-sm'
const btnPrimaryCls = `${btnBase} bg-[#0A0E1A] text-white hover:bg-[#0A0E1A]/90 active:bg-[#0A0E1A]`
const btnOutlineCls = `${btnBase} border border-[#E5E8EE] bg-white text-[#0A0E1A] hover:bg-[#F7F8FA] hover:text-[#0A0E1A]`

interface StepNavigationProps {
  currentStep: number
  totalSteps: number
  onBack: () => void
  onNext: () => void
  onSubmit: () => void
  isSubmitting?: boolean
}

export function StepNavigation({
  currentStep,
  totalSteps,
  onBack,
  onNext,
  onSubmit,
  isSubmitting = false,
}: StepNavigationProps) {
  const { t } = useTranslation()
  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === totalSteps - 1

  return (
    <div className='flex w-full items-center justify-end gap-2'>
      {!isFirstStep && (
        <Button type='button' variant='outline' onClick={onBack} className={btnOutlineCls}>
          {t('Back')}
        </Button>
      )}

      {!isLastStep && (
        <Button type='button' onClick={onNext} className={btnPrimaryCls}>
          {t('Next')}
        </Button>
      )}

      {isLastStep && (
        <Button
          type='button'
          onClick={onSubmit}
          disabled={isSubmitting}
          className={btnPrimaryCls}
        >
          {isSubmitting ? (
            <>
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              {t('Initializing…')}
            </>
          ) : (
            <>
              <CheckCircle2 className='mr-2 h-4 w-4' />
              {t('Initialize system')}
            </>
          )}
        </Button>
      )}
    </div>
  )
}
