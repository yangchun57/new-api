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
import { useTranslation } from 'react-i18next'

type StatisticsCardProps = {
  label: string
  count: number
  total: number
}

export function StatisticsCard({ label, count, total }: StatisticsCardProps) {
  const { t } = useTranslation()
  return (
    <div className='rounded-md border p-3'>
      <div className='text-[#8A93A4] mb-1 text-[12px] font-medium'>
        {label}
      </div>
      <div className='flex items-baseline gap-2'>
        <span className='text-[#0A0E1A] text-2xl font-semibold'>{count}</span>
        <span className='text-[#8A93A4] text-[12px]'>
          {t('of')} {total}
        </span>
      </div>
    </div>
  )
}
