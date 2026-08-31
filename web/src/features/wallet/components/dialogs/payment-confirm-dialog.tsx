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
import { Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { formatLocalCurrencyAmount } from '@/lib/currency'

import { DEFAULT_DISCOUNT_RATE } from '../../constants'
import { formatCurrency, getPaymentIcon } from '../../lib'
import type { PaymentMethod } from '../../types'

interface PaymentConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  topupAmount: number
  paymentAmount: number
  paymentMethod: PaymentMethod | undefined
  calculating: boolean
  processing: boolean
  discountRate?: number
  usdExchangeRate?: number
}

export function PaymentConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  topupAmount,
  paymentAmount,
  paymentMethod,
  calculating,
  processing,
  discountRate = DEFAULT_DISCOUNT_RATE,
  usdExchangeRate = 1,
}: PaymentConfirmDialogProps) {
  const { t } = useTranslation()
  const hasDiscount = discountRate > 0 && discountRate < 1 && paymentAmount > 0
  const originalAmount = hasDiscount ? paymentAmount / discountRate : 0
  const discountAmount = hasDiscount ? originalAmount - paymentAmount : 0

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className='max-sm:w-[calc(100vw-1.5rem)] sm:max-w-md bg-white ring-[#E5E8EE] shadow-[0_8px_30px_rgba(10,14,26,0.08)]'>
        <AlertDialogHeader>
          <AlertDialogTitle className='text-[16px] font-semibold tracking-[-0.015em] text-[#0A0E1A] leading-none'>
            {t('Confirm Payment')}
          </AlertDialogTitle>
          <AlertDialogDescription className='text-[13px] leading-relaxed text-[#5A6478]'>
            {t('Review your payment details')}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className='space-y-3 py-3 sm:space-y-4 sm:py-4'>
          <div className='flex items-center justify-between'>
            <span className='text-[13px] text-[#5A6478]'>
              {t('Topup Amount')}
            </span>
            <span className='text-[16px] font-semibold tracking-[-0.01em] text-[#0A0E1A] tabular-nums'>
              {formatLocalCurrencyAmount(topupAmount * usdExchangeRate, {
                digitsLarge: 2,
                digitsSmall: 2,
                abbreviate: false,
              })}
            </span>
          </div>

          <div className='flex items-center justify-between'>
            <span className='text-[13px] text-[#5A6478]'>
              {t('You Pay')}
            </span>
            {calculating ? (
              <Skeleton className='h-6 w-24 rounded-md' />
            ) : (
              <div className='flex items-baseline gap-2'>
                <span className='text-2xl font-semibold tracking-[-0.015em] text-[#0A0E1A] tabular-nums'>
                  {formatCurrency(paymentAmount)}
                </span>
                {hasDiscount && (
                  <span className='text-[13px] text-[#B8BFCC] line-through tabular-nums'>
                    {formatCurrency(originalAmount)}
                  </span>
                )}
              </div>
            )}
          </div>

          {hasDiscount && !calculating && (
            <div className='rounded-md border border-[#E5E8EE] bg-[#F7F8FA] p-3'>
              <div className='flex items-center justify-between text-[13px]'>
                <span className='text-[#8A93A4]'>{t('You save')}</span>
                <span className='font-semibold text-green-600 tabular-nums'>
                  {formatCurrency(discountAmount)}
                </span>
              </div>
            </div>
          )}

          <div className='border-t border-[#E5E8EE] pt-4'>
            <div className='flex items-center justify-between'>
              <span className='text-[13px] text-[#5A6478]'>
                {t('Payment Method')}
              </span>
              <div className='flex items-center gap-2'>
                {getPaymentIcon(
                  paymentMethod?.type,
                  'h-4 w-4',
                  paymentMethod?.icon,
                  paymentMethod?.name
                )}
                <span className='text-[13px] font-medium text-[#0A0E1A]'>{paymentMethod?.name}</span>
              </div>
            </div>
          </div>
        </div>

        <AlertDialogFooter className='grid grid-cols-2 gap-2 sm:flex bg-[#F7F8FA] border-[#E5E8EE]'>
          <AlertDialogCancel disabled={processing}>
            {t('Cancel')}
          </AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={processing}>
            {processing && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
            {t('Confirm Payment')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
