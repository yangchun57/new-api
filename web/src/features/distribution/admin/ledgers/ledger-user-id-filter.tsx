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
import { getRouteApi } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

import { Input } from '@/components/ui/input'

const route = getRouteApi('/_authenticated/distribution/ledgers')

export function LedgerUserIdFilter() {
  const { t } = useTranslation()
  const search = route.useSearch()
  const navigate = route.useNavigate()

  return (
    <Input
      type='number'
      min={0}
      value={search.userId ?? ''}
      onChange={(e) => {
        const value = e.target.value
        navigate({
          search: (prev) => ({
            ...prev,
            page: undefined,
            userId: value ? Number.parseInt(value, 10) : undefined,
          }),
        })
      }}
      placeholder={t('Filter by commission owner ID')}
      className='h-9 w-[220px]'
      aria-label={t('Filter by commission owner ID')}
    />
  )
}
