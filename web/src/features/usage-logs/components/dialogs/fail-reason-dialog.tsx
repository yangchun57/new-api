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
import { Copy, Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Dialog } from '@/components/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard'

interface FailReasonDialogProps {
  failReason: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function FailReasonDialog({
  failReason,
  open,
  onOpenChange,
}: FailReasonDialogProps) {
  const { t } = useTranslation()
  const { copiedText, copyToClipboard } = useCopyToClipboard({ notify: false })

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('Fail Reason Details')}
      description={t('View the complete error message and details')}
      contentClassName='sm:max-w-lg'
      contentHeight='auto'
      bodyClassName='space-y-4'
    >
      <ScrollArea className='max-h-[500px] pr-4'>
        <div className='space-y-4 py-4'>
          <div className='space-y-2'>
            <Label className='text-[13px] font-medium text-[#0A0E1A]'>
              {t('Error Message')}
            </Label>
            <div className='bg-[#FEF2F2] relative rounded-xl border border-[#FCA5A5] p-4'>
              <Button
                variant='ghost'
                size='sm'
                className='absolute top-2 right-2 h-8 w-8 p-0'
                onClick={() => copyToClipboard(failReason)}
                title={t('Copy to clipboard')}
              >
                {copiedText === failReason ? (
                  <Check className='size-4 text-[#16A34A]' />
                ) : (
                  <Copy className='size-4' />
                )}
              </Button>
              <p className='overflow-wrap-anywhere pr-10 text-[13px] leading-relaxed break-all whitespace-pre-wrap text-[#E5484D]'>
                {failReason || '-'}
              </p>
            </div>
          </div>
        </div>
      </ScrollArea>
    </Dialog>
  )
}
