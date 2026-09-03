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
import { useQuery } from '@tanstack/react-query'
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { assignDistributionGroup, getDistributionGroups } from '../../api'
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../../constants'
import { useUsers } from './users-provider'

const assignSchema = z.object({
  group_id: z.number().int().positive(),
})

type AssignFormValues = z.infer<typeof assignSchema>

export function UsersAssignDialog() {
  const { t } = useTranslation()
  const { open, setOpen, currentRow, triggerRefresh } = useUsers()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { data: groupsData } = useQuery({
    queryKey: ['distribution-groups-options'],
    queryFn: async () => {
      const result = await getDistributionGroups()
      return result.success ? result.data || [] : []
    },
  })
  const groups = groupsData || []

  const form = useForm<AssignFormValues>({
    resolver: zodResolver(assignSchema),
    defaultValues: { group_id: 0 },
  })

  useEffect(() => {
    if (open === 'assign') {
      form.reset({ group_id: currentRow?.distribution_group_id || 0 })
    }
  }, [open, currentRow, form])

  const onSubmit = async (values: AssignFormValues) => {
    if (!currentRow) return
    setIsSubmitting(true)
    try {
      const result = await assignDistributionGroup({
        user_id: currentRow.id,
        group_id: values.group_id,
      })
      if (result.success) {
        toast.success(t(SUCCESS_MESSAGES.GROUP_ASSIGNED))
        setOpen(null)
        triggerRefresh()
      } else {
        toast.error(result.message || t(ERROR_MESSAGES.ASSIGN_GROUP_FAILED))
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open === 'assign'}
      onOpenChange={(isOpen) => !isOpen && setOpen(null)}
      title={t('Assign Group')}
      description={t('Assign a user to a distribution group.')}
      contentClassName='sm:max-w-md'
      footer={
        <>
          <Button variant='outline' size='sm' onClick={() => setOpen(null)}>
            {t('Cancel')}
          </Button>
          <Button
            size='sm'
            onClick={form.handleSubmit(onSubmit)}
            disabled={isSubmitting}
          >
            {isSubmitting ? t('Saving...') : t('Assign')}
          </Button>
        </>
      }
    >
      <Form {...form}>
        <form id='users-assign-form' className='space-y-4'>
          <FormField
            control={form.control}
            name='group_id'
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('Distribution Group')}</FormLabel>
                <Select
                  items={groups.map((group) => ({
                    value: String(group.id),
                    label: `${group.name} (${group.commission_rate}%)`,
                  }))}
                  value={field.value ? String(field.value) : undefined}
                  onValueChange={(value) =>
                    field.onChange(value ? Number.parseInt(value, 10) || 0 : 0)
                  }
                >
                  <FormControl>
                    <SelectTrigger className='w-full'>
                      <SelectValue placeholder={t('Select a group')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent alignItemWithTrigger={false}>
                    <SelectGroup>
                      {groups.map((group) => (
                        <SelectItem key={group.id} value={String(group.id)}>
                          {group.name} ({group.commission_rate}%)
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
    </Dialog>
  )
}
