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

import {
  SideDrawerSection,
  sideDrawerContentClassName,
  sideDrawerFooterClassName,
  sideDrawerFormClassName,
  sideDrawerHeaderClassName,
} from '@/components/drawer-layout'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'

import { createDistributionGroup, updateDistributionGroup } from '../../api'
import { COMMISSION_RATE_MAX, SUCCESS_MESSAGES } from '../../constants'
import {
  getGroupFormSchema,
  transformGroupFormToPayload,
  transformGroupToFormDefaults,
  GROUP_FORM_DEFAULT_VALUES,
  type GroupFormValues,
} from '../../lib'
import type { DistributionGroup } from '../../types'
import { useGroups } from './groups-provider'

type GroupsMutateDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow?: DistributionGroup
}

export function GroupsMutateDrawer({
  open,
  onOpenChange,
  currentRow,
}: GroupsMutateDrawerProps) {
  const { t } = useTranslation()
  const isUpdate = !!currentRow
  const { triggerRefresh } = useGroups()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<GroupFormValues>({
    resolver: zodResolver(getGroupFormSchema(t)),
    defaultValues: GROUP_FORM_DEFAULT_VALUES,
  })

  useEffect(() => {
    if (!open) return
    if (currentRow) {
      form.reset(transformGroupToFormDefaults(currentRow))
    } else {
      form.reset(GROUP_FORM_DEFAULT_VALUES)
    }
  }, [open, currentRow, form])

  const onSubmit = async (data: GroupFormValues) => {
    setIsSubmitting(true)
    try {
      const payload = transformGroupFormToPayload(data)
      const result = isUpdate && currentRow
        ? await updateDistributionGroup({ ...payload, id: currentRow.id })
        : await createDistributionGroup(payload)

      if (result.success) {
        toast.success(
          t(
            isUpdate
              ? SUCCESS_MESSAGES.GROUP_UPDATED
              : SUCCESS_MESSAGES.GROUP_CREATED
          )
        )
        onOpenChange(false)
        triggerRefresh()
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v)
        if (!v) form.reset()
      }}
    >
      <SheetContent className={sideDrawerContentClassName('sm:max-w-[520px]')}>
        <SheetHeader className={sideDrawerHeaderClassName()}>
          <SheetTitle>
            {isUpdate ? t('Update Distribution Group') : t('Create Distribution Group')}
          </SheetTitle>
          <SheetDescription>
            {isUpdate
              ? t('Update the distribution group details below.')
              : t('Add a new distribution group with a commission rate.')}{' '}
            {t('Click save when you&apos;re done.')}
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form
            id='distribution-group-form'
            onSubmit={form.handleSubmit(onSubmit)}
            className={sideDrawerFormClassName()}
          >
            <fieldset disabled={isSubmitting} className='contents'>
              <SideDrawerSection>
                <FormField
                  control={form.control}
                  name='name'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('Name')}</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder={t('Enter a name')} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='commission_rate'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('Commission Rate (%)')}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type='number'
                          min={0}
                          max={COMMISSION_RATE_MAX}
                          step={0.01}
                          onChange={(e) =>
                            field.onChange(Number.parseFloat(e.target.value) || 0)
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        {t('Percentage of referred users\' consumption credited as commission.')}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='is_default'
                  render={({ field }) => (
                    <FormItem className='flex flex-row items-center justify-between rounded-lg border bg-card p-3'>
                      <div className='space-y-0.5'>
                        <FormLabel>{t('Set as default')}</FormLabel>
                        <FormDescription>
                          {t('Users without an assigned group use the default group.')}
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='description'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('Description')}</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder={t('Optional description')}
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </SideDrawerSection>
            </fieldset>
          </form>
        </Form>
        <SheetFooter className={sideDrawerFooterClassName()}>
          <SheetClose render={<Button variant='outline' />}>
            {t('Close')}
          </SheetClose>
          <Button
            form='distribution-group-form'
            type='submit'
            disabled={isSubmitting}
          >
            {isSubmitting ? t('Saving...') : t('Save changes')}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
