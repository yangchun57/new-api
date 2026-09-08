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

import { SettingsSwitchField } from '../components/settings-form-layout'
import { SettingsSection } from '../components/settings-section'
import { useUpdateOption } from '../hooks/use-update-option'

type DistributionSettingsSectionProps = {
  defaultVisible: boolean
}

export function DistributionSettingsSection({
  defaultVisible,
}: DistributionSettingsSectionProps) {
  const { t } = useTranslation()
  const updateOption = useUpdateOption()
  const [visible, setVisible] = useState(defaultVisible)

  const handleToggle = async (checked: boolean) => {
    const previous = visible
    setVisible(checked)
    try {
      await updateOption.mutateAsync({
        key: 'DistributionVisibleDefault',
        value: checked,
      })
    } catch {
      setVisible(previous)
      toast.error(t('Failed to update setting'))
    }
  }

  return (
    <SettingsSection title={t('Distribution')}>
      <div className='space-y-2'>
        <p className='text-[13px] text-[#5A6478]'>
          {t(
            'Control whether the My Distribution page and the referral program are shown to users by default. Individual users can still be toggled on the Users page.'
          )}
        </p>
        <SettingsSwitchField
          checked={visible}
          onCheckedChange={handleToggle}
          label={t('Distribution visible by default')}
          description={t(
            'New users will see the My Distribution page and the wallet referral program when enabled.'
          )}
        />
      </div>
    </SettingsSection>
  )
}
