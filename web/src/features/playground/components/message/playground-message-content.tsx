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
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import {
  CodeBlock,
  CodeBlockCopyButton,
} from '@/components/ai-elements/code-block'
import { Loader } from '@/components/ai-elements/loader'
import { MessageContent } from '@/components/ai-elements/message'
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from '@/components/ai-elements/reasoning'
import { Response } from '@/components/ai-elements/response'
import { Shimmer } from '@/components/ai-elements/shimmer'
import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from '@/components/ai-elements/sources'
import { cn } from '@/lib/utils'

import { MESSAGE_STATUS } from '../../constants'
import {
  getMessageAlignmentClass,
  getMessageContentState,
  isErrorMessage,
  type MessageAlignment,
} from '../../lib'
import { getMessageContentStyles } from '../../lib/message/message-styles'
import type { Message } from '../../types'
import { MessageError } from './message-error'
import { MessageMetadata } from './message-metadata'

type PlaygroundMessageContentProps = {
  actions: ReactNode
  alignment: MessageAlignment
  errorActions?: ReactNode
  isSourceVisible?: boolean
  message: Message
  versionContent: string
}

export function PlaygroundMessageContent({
  actions,
  alignment,
  errorActions,
  isSourceVisible = false,
  message,
  versionContent,
}: PlaygroundMessageContentProps) {
  const { t } = useTranslation()
  const {
    displayContent,
    hasReasoning,
    hasSources,
    reasoningContent,
    showLoader,
    showMessageContent,
    sources,
  } = getMessageContentState(message, versionContent)
  const isError = isErrorMessage(message)
  const isMessageFinal =
    message.status !== MESSAGE_STATUS.LOADING &&
    message.status !== MESSAGE_STATUS.STREAMING

  return (
    <div
      className={cn(
        'flex w-full min-w-0 flex-col',
        '[&_.group\/code-block]:rounded-xl [&_.group\/code-block]:border-[#0A0E1A] [&_.group\/code-block]:bg-[#0A0E1A] [&_.group\/code-block]:text-[#E8EBF1] [&_.group\/code-block]:shadow-none',
        '[&_.group\/code-block]:[--foreground:#E8EBF1] [&_.group\/code-block]:[--muted-foreground:#8A93A4]',
        '[&_.group\/code-block>div:first-child]:border-[#E5E8EE]/20 [&_.group\/code-block>div:first-child]:bg-[#0A0E1A]/60 [&_.group\/code-block>div:first-child]:text-[#8A93A4]',
        '[&_[class*="group/reasoning-content"]]:rounded-xl [&_[class*="group/reasoning-content"]]:border [&_[class*="group/reasoning-content"]]:border-[#E5E8EE] [&_[class*="group/reasoning-content"]]:bg-[#F7F8FA]',
        '[&_[class*="group/reasoning-content"]]:border-l-0 [&_[class*="group/reasoning-content"]]:ml-0 [&_[class*="group/reasoning-content"]]:mt-2 [&_[class*="group/reasoning-content"]]:p-3 [&_[class*="group/reasoning-content"]]:pl-3',
        '[&_[class*="group/reasoning-content"]]:text-[#8A93A4] [&_[class*="group/reasoning-content"]]:text-[12px] [&_[class*="group/reasoning-content"]]:font-mono [&_[class*="group/reasoning-content"]]:leading-relaxed',
        '[&_[data-slot="collapsible-trigger"]]:text-[#8A93A4] [&_[data-slot="collapsible-trigger"]]:hover:text-[#0A0E1A] [&_[data-slot="collapsible-trigger"]]:text-[12px]',
        '[&_.not-prose.text-primary]:text-[#8A93A4] [&_.not-prose.text-primary_a]:text-[#2E4BFF] [&_.not-prose.text-primary_a:hover]:text-[#2E4BFF]/80',
        getMessageAlignmentClass(alignment)
      )}
    >
      {hasSources && (
        <Sources className='text-[#8A93A4] text-[12px] [&_p]:text-[#8A93A4] [&_p]:text-[12px] [&_a]:text-[#2E4BFF] [&_a:hover]:text-[#2E4BFF]/80 [&_svg]:text-[#8A93A4]'>
          <SourcesTrigger count={sources.length} />
          <SourcesContent className='border-[#E5E8EE]'>
            {sources.map((source) => (
              <Source
                href={source.href}
                key={`${source.href}-${source.title}`}
                title={source.title}
              />
            ))}
          </SourcesContent>
        </Sources>
      )}

      {hasReasoning && (
        <Reasoning
          defaultOpen
          duration={message.reasoning?.duration}
          isStreaming={message.isReasoningStreaming}
        >
          <ReasoningTrigger />
          <ReasoningContent>{reasoningContent}</ReasoningContent>
        </Reasoning>
      )}

      {showLoader && (
        <div className='flex items-center gap-2 py-3 text-[#8A93A4]'>
          <Loader />
          <Shimmer className='text-[13px] text-[#8A93A4]' duration={1}>
            {t('Responding...')}
          </Shimmer>
        </div>
      )}

      {isError && (
        <>
          <MessageError message={message} className='mb-2' />
          <MessageMetadata alignment={alignment} message={message} />
          {errorActions}
        </>
      )}

      {!isError && showMessageContent && (
        <>
          {isSourceVisible ? (
            <CodeBlock
              code={versionContent}
              className='my-0 group-[.is-assistant]:w-full group-[.is-assistant]:max-w-[78ch]'
              collapsedLines={24}
              defaultCollapsed={false}
              language='markdown'
              maxExpandedLines={48}
              showLineNumbers
              showToolbar
              title={t('Raw response')}
            >
              <CodeBlockCopyButton />
            </CodeBlock>
          ) : (
            <MessageContent
              variant='flat'
              className={cn(getMessageContentStyles())}
            >
              <Response final={isMessageFinal}>{displayContent}</Response>
            </MessageContent>
          )}
          <MessageMetadata alignment={alignment} message={message} />
          {actions}
        </>
      )}
    </div>
  )
}
