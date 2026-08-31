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
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import { Dialog } from '@/components/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  formatQuota,
  parseQuotaFromDollars,
  quotaUnitsToDollars,
} from '@/lib/format'
import {
  DEFAULT_CURRENCY_CONFIG,
  useSystemConfigStore,
} from '@/stores/system-config-store'

interface TransferDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (amount: number) => Promise<boolean>
  availableQuota: number
  transferring: boolean
}

export function TransferDialog({
  open,
  onOpenChange,
  onConfirm,
  availableQuota,
  transferring,
}: TransferDialogProps) {
  const { t } = useTranslation()
  const currencyConfig = useSystemConfigStore((state) => state.config.currency)
  const minimumQuota = Math.ceil(
    currencyConfig.quotaPerUnit > 0
      ? currencyConfig.quotaPerUnit
      : DEFAULT_CURRENCY_CONFIG.quotaPerUnit
  )
  const minimumAmount = quotaUnitsToDollars(minimumQuota)
  const maximumAmount = quotaUnitsToDollars(availableQuota)
  const [amount, setAmount] = useState(minimumAmount)
  const transferQuota = parseQuotaFromDollars(amount)
  const canTransfer =
    Number.isFinite(amount) &&
    transferQuota >= minimumQuota &&
    transferQuota <= availableQuota

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAmount(minimumAmount)
    }
  }, [minimumAmount, open])

  const handleConfirm = async () => {
    if (!canTransfer) return

    const success = await onConfirm(transferQuota)
    if (success) {
      onOpenChange(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('Transfer Rewards')}
      description={t('Move affiliate rewards to your main balance')}
      contentClassName='max-sm:w-[calc(100vw-1.5rem)] sm:max-w-md bg-white ring-[#E5E8EE] shadow-[0_8px_30px_rgba(10,14,26,0.08)]'
      footerClassName='grid grid-cols-2 gap-2 sm:flex bg-[#F7F8FA] border-[#E5E8EE]'
      contentHeight='auto'
      bodyClassName='space-y-4'
      footer={
        <>
          <Button
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={transferring}
          >
            {t('Cancel')}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={transferring || !canTransfer}
          >
            {transferring && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
            {t('Transfer')}
          </Button>
        </>
      }
    >
      <div className='space-y-4 py-3 sm:space-y-6 sm:py-4'>
        <div className='space-y-2'>
          <Label className='pl-font-mono text-[11px] font-medium tracking-[0.08em] uppercase text-[#8A93A4]'>
            {t('Available Rewards')}
          </Label>
          <div className='text-2xl font-semibold tracking-[-0.015em] text-[#0A0E1A] tabular-nums'>
            {formatQuota(availableQuota)}
          </div>
        </div>

        <div className='space-y-3'>
          <Label
            htmlFor='transfer-amount'
            className='pl-font-mono text-[11px] font-medium tracking-[0.08em] uppercase text-[#8A93A4]'
          >
            {t('Transfer Amount')}
          </Label>
          <Input
            id='transfer-amount'
            type='number'
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            min={minimumAmount}
            max={maximumAmount}
            step={minimumAmount}
            className='font-mono text-[16px] text-[#0A0E1A] border-[#E5E8EE] bg-white focus-visible:border-[#0A0E1A]/30 focus-visible:ring-[#0A0E1A]/10'
          />
          <p className='text-[12px] text-[#8A93A4]'>
            {t('Minimum:')} {formatQuota(minimumQuota)}
          </p>
        </div>
      </div>
    </Dialog>
  )
}
