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
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { Switch } from '@/components/ui/switch'

import { setDistributionEnabled } from '@/features/distribution/api'

import type { User } from '../types'
import { useUsers } from './users-provider'

export function UserDistributionToggle({ user }: { user: User }) {
  const { t } = useTranslation()
  const { triggerRefresh } = useUsers()
  const [pending, setPending] = useState(false)

  const handleToggle = async (checked: boolean) => {
    setPending(true)
    try {
      const result = await setDistributionEnabled({
        user_id: user.id,
        enabled: checked,
      })
      if (result.success) {
        toast.success(
          t(
            checked
              ? 'Distribution enabled successfully'
              : 'Distribution disabled successfully'
          )
        )
        triggerRefresh()
      } else {
        toast.error(result.message || t('Failed to update distribution permission'))
      }
    } catch {
      toast.error(t('Failed to update distribution permission'))
    } finally {
      setPending(false)
    }
  }

  return (
    <Switch
      checked={user.distribution_enabled === true}
      onCheckedChange={handleToggle}
      disabled={pending}
      aria-label={t('Distribution permission')}
    />
  )
}
