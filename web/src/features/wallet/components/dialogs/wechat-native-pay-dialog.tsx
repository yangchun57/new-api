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
import { Loader2, RefreshCw } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { QRCodeSVG } from 'qrcode.react'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'

import { getUserBillingHistory } from '../../api'

interface WechatNativePayDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  codeUrl: string
  tradeNo: string
  onPaid: () => void
}

const POLL_INTERVAL_MS = 3000

export function WechatNativePayDialog({
  open,
  onOpenChange,
  codeUrl,
  tradeNo,
  onPaid,
}: WechatNativePayDialogProps) {
  const { t } = useTranslation()
  const [paid, setPaid] = useState(false)
  const [polling, setPolling] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!open || !tradeNo) {
      return
    }
    setPaid(false)
    setPolling(true)

    const check = async () => {
      try {
        const response = await getUserBillingHistory(1, 5, tradeNo)
        const items = response.data?.items ?? []
        const success = items.some(
          (item) => item.trade_no === tradeNo && item.status === 'success'
        )
        if (success) {
          setPaid(true)
          setPolling(false)
          if (timerRef.current) {
            clearInterval(timerRef.current)
            timerRef.current = null
          }
        }
      } catch {
        // Ignore transient polling errors; keep polling until user closes.
      }
    }

    void check()
    timerRef.current = setInterval(check, POLL_INTERVAL_MS)

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [open, tradeNo])

  const handlePaid = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    onOpenChange(false)
    onPaid()
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className='max-sm:w-[calc(100vw-1.5rem)] sm:max-w-sm bg-white ring-[#E5E8EE] shadow-[0_8px_30px_rgba(10,14,26,0.08)]'>
        <AlertDialogHeader>
          <AlertDialogTitle className='text-[16px] font-semibold tracking-[-0.015em] text-[#0A0E1A] leading-none'>
            {t('Scan to Pay')}
          </AlertDialogTitle>
          <AlertDialogDescription className='text-[13px] leading-relaxed text-[#5A6478]'>
            {t('Open WeChat and scan the QR code to complete payment')}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className='flex flex-col items-center gap-3 py-2'>
          <div className='rounded-xl border border-[#E5E8EE] bg-white p-3'>
            <QRCodeSVG value={codeUrl} size={200} />
          </div>
          {polling && (
            <div className='flex items-center gap-2 text-[12px] text-[#8A93A4]'>
              <Loader2 className='h-3.5 w-3.5 animate-spin' />
              {t('Waiting for payment...')}
            </div>
          )}
          {!polling && paid && (
            <div className='flex items-center gap-2 text-[13px] font-medium text-green-600'>
              {t('Payment successful')}
            </div>
          )}
        </div>

        <AlertDialogFooter className='grid grid-cols-1 gap-2 sm:grid-cols-2 bg-[#F7F8FA] border-[#E5E8EE]'>
          <Button
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={paid}
          >
            {t('Cancel')}
          </Button>
          <AlertDialogAction onClick={handlePaid}>
            {paid && <RefreshCw className='mr-2 h-4 w-4' />}
            {paid ? t('Done') : t('I have paid')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
