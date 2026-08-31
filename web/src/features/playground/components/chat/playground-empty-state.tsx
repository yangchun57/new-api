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
import {
  BarChartIcon,
  CodeSquareIcon,
  GraduationCapIcon,
  MessageSquarePlusIcon,
  NotepadTextIcon,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'

type PlaygroundEmptyStateProps = {
  onSelectPrompt: (prompt: string) => void
}

const starterPrompts = [
  { icon: BarChartIcon, text: 'Analyze data' },
  { icon: NotepadTextIcon, text: 'Summarize text' },
  { icon: CodeSquareIcon, text: 'Code' },
  { icon: GraduationCapIcon, text: 'Get advice' },
]

export function PlaygroundEmptyState({
  onSelectPrompt,
}: PlaygroundEmptyStateProps) {
  const { t } = useTranslation()

  return (
    <div className='flex min-h-[min(520px,calc(100svh-18rem))] items-center justify-center px-1 py-8 md:py-12'>
      <div className='grid w-full max-w-2xl gap-5 text-center'>
        <div className='bg-[#F7F8FA] text-[#8A93A4] mx-auto flex size-12 items-center justify-center rounded-xl border border-[#E5E8EE]'>
          <MessageSquarePlusIcon className='size-5' aria-hidden='true' />
        </div>

        <div className='grid gap-2'>
          <h2 className='text-[14px] font-semibold tracking-tight text-[#0A0E1A]'>
            {t('Start a playground chat')}
          </h2>
          <p className='text-[#5A6478] mx-auto max-w-lg text-[13px] leading-[1.7]'>
            {t(
              'Test a model with a starter prompt, or write your own request below.'
            )}
          </p>
        </div>

        <div className='grid gap-2 sm:grid-cols-2'>
          {starterPrompts.map(({ icon: Icon, text }) => {
            const prompt = t(text)

            return (
              <Button
                className='h-auto min-h-11 justify-start gap-2 rounded-xl border-[#E5E8EE] bg-white px-3 py-2.5 text-left text-[13px] text-[#0A0E1A] whitespace-normal shadow-none hover:bg-[#F0F2F6] hover:text-[#0A0E1A]'
                key={text}
                onClick={() => onSelectPrompt(prompt)}
                variant='outline'
              >
                <Icon className='text-[#8A93A4] size-4' />
                <span>{prompt}</span>
              </Button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
