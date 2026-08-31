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
import { useNavigate } from '@tanstack/react-router'
import { User, Wallet, LogOut, Settings } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { SignOutDialog } from '@/components/sign-out-dialog'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import useDialogState from '@/hooks/use-dialog'
import { useIsSidebarModuleVisible } from '@/hooks/use-sidebar-config'
import { useUserDisplay } from '@/hooks/use-user-display'
import { getUserAvatarFallback, getUserAvatarStyle } from '@/lib/avatar'
import { ROLE } from '@/lib/roles'
import { useAuthStore } from '@/stores/auth-store'

const avatarFallbackClassName = 'font-semibold text-white'

export function ProfileDropdown() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [open, setOpen] = useDialogState()
  const user = useAuthStore((state) => state.auth.user)
  const { displayName, roleLabel } = useUserDisplay(user)
  const isSuperAdmin = user?.role === ROLE.SUPER_ADMIN
  const isWalletVisible = useIsSidebarModuleVisible('/wallet')
  const avatarName = user?.username || displayName
  const avatarFallback = getUserAvatarFallback(avatarName)
  const avatarFallbackStyle = useMemo(
    () => getUserAvatarStyle(avatarName),
    [avatarName]
  )

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger
          render={
            <Button
              variant='ghost'
              className='relative size-9 rounded-lg p-0 hover:bg-[#F0F2F6]'
              aria-label={t('Account menu')}
            />
          }
        >
          <Avatar className='size-7 rounded-md'>
            <AvatarFallback
              className={`${avatarFallbackClassName} rounded-md text-[11px]`}
              style={avatarFallbackStyle}
            >
              {avatarFallback}
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align='end'
          sideOffset={8}
          className='w-56 rounded-xl border-[#E5E8EE] p-1.5 shadow-lg'
        >
          <div className='flex items-center gap-2.5 rounded-lg px-2 py-2'>
            <Avatar className='size-9 rounded-md'>
              <AvatarFallback
                className={`${avatarFallbackClassName} rounded-md text-xs`}
                style={avatarFallbackStyle}
              >
                {avatarFallback}
              </AvatarFallback>
            </Avatar>
            <div className='flex flex-1 flex-col gap-0.5 overflow-hidden'>
              <p className='truncate text-[13px] font-semibold text-[#0A0E1A]'>
                {displayName}
              </p>
              <div className='flex items-center gap-1.5'>
                <span className='text-[11px] text-[#8A93A4]'>
                  {roleLabel}
                </span>
                {user?.group && (
                  <>
                    <span className='text-[11px] text-[#B8BFCC]'>·</span>
                    <span className='truncate text-[11px] text-[#8A93A4]'>
                      {String(user.group)}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <DropdownMenuSeparator className='my-1 bg-[#E5E8EE]' />

          <DropdownMenuItem
            onClick={() => navigate({ to: '/profile' })}
            className='gap-2.5 rounded-lg px-2 py-2 text-[13px] text-[#5A6478] focus:bg-[#F0F2F6] focus:text-[#0A0E1A] [&>svg]:size-[16px] [&>svg]:text-[#8A93A4]'
          >
            <User />
            {t('Profile')}
          </DropdownMenuItem>

          {isWalletVisible && (
            <DropdownMenuItem
              onClick={() => navigate({ to: '/wallet' })}
              className='gap-2.5 rounded-lg px-2 py-2 text-[13px] text-[#5A6478] focus:bg-[#F0F2F6] focus:text-[#0A0E1A] [&>svg]:size-[16px] [&>svg]:text-[#8A93A4]'
            >
              <Wallet />
              {t('Wallet')}
            </DropdownMenuItem>
          )}

          {isSuperAdmin && (
            <DropdownMenuItem
              onClick={() =>
                navigate({
                  to: '/system-settings/site/$section',
                  params: { section: 'system-info' },
                })
              }
              className='gap-2.5 rounded-lg px-2 py-2 text-[13px] text-[#5A6478] focus:bg-[#F0F2F6] focus:text-[#0A0E1A] [&>svg]:size-[16px] [&>svg]:text-[#8A93A4]'
            >
              <Settings />
              {t('System Settings')}
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator className='my-1 bg-[#E5E8EE]' />

          <DropdownMenuItem
            variant='destructive'
            onClick={() => setOpen(true)}
            className='gap-2.5 rounded-lg px-2 py-2 text-[13px] [&>svg]:size-[16px]'
          >
            <LogOut />
            {t('Sign out')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <SignOutDialog open={!!open} onOpenChange={setOpen} />
    </>
  )
}
