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
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { z } from 'zod'

import { Dialog } from '@/components/dialog'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

import { deductDistributionCommission } from '../../api'
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../../constants'
import { useUsers } from './users-provider'

const deductSchema = z.object({
  amount: z.number().int().positive(),
  remark: z.string().optional(),
})

type DeductFormValues = z.infer<typeof deductSchema>

export function UsersDeductDialog() {
  const { t } = useTranslation()
  const { open, setOpen, currentRow, triggerRefresh } = useUsers()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<DeductFormValues>({
    resolver: zodResolver(deductSchema),
    defaultValues: { amount: 0, remark: '' },
  })

  useEffect(() => {
    if (open === 'deduct') {
      form.reset({ amount: 0, remark: '' })
    }
  }, [open, form])

  const onSubmit = async (values: DeductFormValues) => {
    if (!currentRow) return
    setIsSubmitting(true)
    try {
      const result = await deductDistributionCommission({
        user_id: currentRow.id,
        amount: values.amount,
        remark: values.remark,
      })
      if (result.success) {
        toast.success(t(SUCCESS_MESSAGES.COMMISSION_DEDUCTED))
        setOpen(null)
        triggerRefresh()
      } else {
        toast.error(result.message || t(ERROR_MESSAGES.DEDUCT_FAILED))
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open === 'deduct'}
      onOpenChange={(isOpen) => !isOpen && setOpen(null)}
      title={t('Deduct Commission')}
      description={t('Manually deduct commission. Shortfall becomes debt.')}
      contentClassName='sm:max-w-md'
      footer={
        <>
          <Button variant='outline' size='sm' onClick={() => setOpen(null)}>
            {t('Cancel')}
          </Button>
          <Button
            size='sm'
            variant='destructive'
            onClick={form.handleSubmit(onSubmit)}
            disabled={isSubmitting}
          >
            {isSubmitting ? t('Saving...') : t('Deduct')}
          </Button>
        </>
      }
    >
      <Form {...form}>
        <form id='users-deduct-form' className='space-y-4'>
          <FormField
            control={form.control}
            name='amount'
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('Amount')}</FormLabel>
                <FormControl>
                  <Input
                    type='number'
                    min={1}
                    placeholder={t('Enter amount')}
                    value={field.value || ''}
                    onChange={(e) =>
                      field.onChange(Number.parseInt(e.target.value, 10) || 0)
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='remark'
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('Remark')}</FormLabel>
                <FormControl>
                  <Textarea {...field} rows={2} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
    </Dialog>
  )
}
