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
import { Search, Copy, Check, ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Dialog } from '@/components/dialog'
import { StatusBadge } from '@/components/status-badge'
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
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard'
import { formatCurrencyFromUSD } from '@/lib/currency'
import { formatNumber } from '@/lib/format'

import { useBillingHistory } from '../../hooks/use-billing-history'
import {
  getStatusConfig,
  getPaymentMethodName,
  formatTimestamp,
} from '../../lib/billing'

interface BillingHistoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function BillingHistoryDialog({
  open,
  onOpenChange,
}: BillingHistoryDialogProps) {
  const { t } = useTranslation()
  const {
    records,
    total,
    page,
    pageSize,
    keyword,
    loading,
    completing,
    isAdmin,
    handlePageChange,
    handlePageSizeChange,
    handleSearch,
    handleCompleteOrder,
  } = useBillingHistory()

  const [confirmTradeNo, setConfirmTradeNo] = useState<string | null>(null)
  const { copyToClipboard, copiedText } = useCopyToClipboard({ notify: false })

  const totalPages = Math.ceil(total / pageSize)

  const handleConfirmComplete = async () => {
    if (confirmTradeNo) {
      const success = await handleCompleteOrder(confirmTradeNo)
      if (success) {
        setConfirmTradeNo(null)
      }
    }
  }

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={onOpenChange}
        title={t('Billing History')}
        description={t(
          'View your topup transaction records and payment history'
        )}
        contentClassName='flex max-h-[calc(100dvh-2rem)] flex-col max-sm:w-screen max-sm:max-w-none max-sm:rounded-none max-sm:p-4 sm:max-w-4xl bg-white ring-[#E5E8EE] shadow-[0_8px_30px_rgba(10,14,26,0.08)]'
        contentHeight='auto'
        bodyClassName='space-y-3'
      >
        <div className='min-h-0 space-y-3'>
          <div className='flex items-center gap-2'>
            <div className='relative flex-1'>
              <Search className='absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#8A93A4]' />
              <Input
                placeholder={t('Search by order number...')}
                value={keyword}
                onChange={(e) => handleSearch(e.target.value)}
                className='h-9 pl-10 border-[#E5E8EE] bg-white text-[13px] text-[#0A0E1A] placeholder:text-[#B8BFCC] focus-visible:border-[#0A0E1A]/30 focus-visible:ring-[#0A0E1A]/10'
              />
            </div>
            <Select
              items={[
                { value: '10', label: t('10 / page') },
                { value: '20', label: t('20 / page') },
                { value: '50', label: t('50 / page') },
                { value: '100', label: t('100 / page') },
              ]}
              value={pageSize.toString()}
              onValueChange={(value) =>
                value !== null && handlePageSizeChange(parseInt(value))
              }
            >
              <SelectTrigger className='h-9 w-[92px] sm:w-32 rounded-md border-[#E5E8EE] bg-white text-[13px] text-[#0A0E1A]'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false}>
                <SelectGroup>
                  <SelectItem value='10'>{t('10 / page')}</SelectItem>
                  <SelectItem value='20'>{t('20 / page')}</SelectItem>
                  <SelectItem value='50'>{t('50 / page')}</SelectItem>
                  <SelectItem value='100'>{t('100 / page')}</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className='max-h-[min(54vh,520px)] overflow-y-auto pr-1'>
            {loading ? (
              <div className='space-y-3'>
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className='rounded-xl border border-[#E5E8EE] bg-white p-3 sm:p-4'
                  >
                    <div className='flex items-start justify-between'>
                      <div className='flex-1 space-y-2'>
                        <Skeleton className='h-4 w-48 rounded-md' />
                        <Skeleton className='h-3 w-32 rounded-md' />
                      </div>
                      <Skeleton className='h-5 w-16 rounded-md' />
                    </div>
                    <div className='mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4'>
                      <Skeleton className='h-3 w-full rounded-md' />
                      <Skeleton className='h-3 w-full rounded-md' />
                      <Skeleton className='h-3 w-full rounded-md' />
                    </div>
                  </div>
                ))}
              </div>
            ) : records.length === 0 ? (
              <div className='flex min-h-40 flex-col items-center justify-center py-10 text-center'>
                <p className='text-[13px] font-medium text-[#0A0E1A]'>
                  {t('No billing records found')}
                </p>
                <p className='mt-1 text-[12px] text-[#8A93A4]'>
                  {keyword
                    ? t('Try adjusting your search')
                    : t('Your transaction history will appear here')}
                </p>
              </div>
            ) : (
              <div className='space-y-3'>
                {records.map((record) => {
                  const statusConfig = getStatusConfig(record.status)
                  return (
                    <div
                      key={record.id}
                      className='rounded-xl border border-[#E5E8EE] bg-white p-3 sm:p-4'
                    >
                      <div className='flex items-start justify-between gap-2'>
                        <div className='flex-1 space-y-1'>
                          <div className='flex min-w-0 items-center gap-2'>
                            <code className='text-[#0A0E1A] truncate font-mono text-[13px] tabular-nums'>
                              {record.trade_no}
                            </code>
                            <Button
                              variant='ghost'
                              size='sm'
                              className='h-6 w-6 rounded-md p-0 text-[#5A6478] hover:bg-[#F0F2F6] hover:text-[#0A0E1A] active:bg-[#E8EBF1]'
                              onClick={() => copyToClipboard(record.trade_no)}
                            >
                              {copiedText === record.trade_no ? (
                                <Check className='h-3 w-3' />
                              ) : (
                                <Copy className='h-3 w-3' />
                              )}
                            </Button>
                            {isAdmin && record.user_id != null && (
                              <StatusBadge
                                label={`${t('User ID')}: ${record.user_id}`}
                                variant='neutral'
                                size='sm'
                                copyText={String(record.user_id)}
                              />
                            )}
                          </div>
                          <div className='text-[12px] text-[#8A93A4]'>
                            {formatTimestamp(record.create_time)}
                          </div>
                        </div>
                        <StatusBadge
                          label={statusConfig.label}
                          variant={statusConfig.variant}
                          showDot
                          copyable={false}
                        />
                      </div>

                      <div className='mt-3 grid grid-cols-2 gap-3 sm:mt-4 sm:grid-cols-3 sm:gap-4'>
                        <div className='space-y-1'>
                          <Label className='text-[12px] text-[#8A93A4]'>
                            {t('Payment Method')}
                          </Label>
                          <div className='text-[13px] font-medium text-[#0A0E1A]'>
                            {getPaymentMethodName(record.payment_method, t)}
                          </div>
                        </div>
                        <div className='space-y-1'>
                          <Label className='text-[12px] text-[#8A93A4]'>
                            {t('Amount')}
                          </Label>
                          <div className='text-[13px] font-semibold text-[#0A0E1A] tabular-nums'>
                            {formatCurrencyFromUSD(record.amount, {
                              digitsLarge: 2,
                              digitsSmall: 2,
                              abbreviate: false,
                            })}
                          </div>
                        </div>
                        <div className='space-y-1'>
                          <Label className='text-[12px] text-[#8A93A4]'>
                            {t('Payment')}
                          </Label>
                          <div className='text-[13px] font-semibold text-red-600 tabular-nums'>
                            {formatNumber(record.money)}
                          </div>
                        </div>
                      </div>

                      {isAdmin && record.status === 'pending' && (
                        <div className='mt-4 flex justify-end'>
                          <Button
                            size='sm'
                            variant='outline'
                            onClick={() => setConfirmTradeNo(record.trade_no)}
                            disabled={completing}
                            className='rounded-md'
                          >
                            {t('Complete Order')}
                          </Button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {!loading && records.length > 0 && (
            <div className='flex flex-col items-center gap-3 border-t border-[#E5E8EE] pt-4 sm:flex-row sm:items-center sm:justify-between'>
              <div className='text-[12px] text-[#8A93A4] sm:text-[13px]'>
                {t('Showing')} {(page - 1) * pageSize + 1}-
                {Math.min(page * pageSize, total)} {t('of')} {total}
              </div>
              <div className='flex items-center gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page <= 1}
                  className='h-8 w-8 rounded-md p-0'
                >
                  <ChevronLeft className='h-4 w-4' />
                </Button>
                <div className='flex items-center gap-1 text-[13px] text-[#5A6478]'>
                  <span className='font-semibold text-[#0A0E1A]'>{page}</span>
                  <span className='text-[#B8BFCC]'>/</span>
                  <span>{totalPages}</span>
                </div>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= totalPages}
                  className='h-8 w-8 rounded-md p-0'
                >
                  <ChevronRight className='h-4 w-4' />
                </Button>
              </div>
            </div>
          )}
        </div>
      </Dialog>

      <AlertDialog
        open={!!confirmTradeNo}
        onOpenChange={(open) => !open && setConfirmTradeNo(null)}
      >
        <AlertDialogContent className='bg-white ring-[#E5E8EE] shadow-[0_8px_30px_rgba(10,14,26,0.08)]'>
          <AlertDialogHeader>
            <AlertDialogTitle className='text-[16px] font-semibold tracking-[-0.015em] text-[#0A0E1A] leading-none'>{t('Complete Order')}</AlertDialogTitle>
            <AlertDialogDescription className='text-[13px] leading-relaxed text-[#5A6478]'>
              {t(
                'Are you sure you want to manually complete this order? The user will be credited with the corresponding quota.'
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className='bg-[#F7F8FA] border-[#E5E8EE]'>
            <AlertDialogCancel disabled={completing}>
              {t('Cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmComplete}
              disabled={completing}
            >
              {completing ? t('Processing...') : t('Confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
