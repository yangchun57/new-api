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
/**
 * Get message content styles based on role
 * Encapsulates styling logic for user and assistant messages
 */
export function getMessageContentStyles() {
  return [
    'group-[.is-assistant]:w-full',
    'group-[.is-assistant]:max-w-[78ch]',
    'group-[.is-user]:w-fit',

    'group-[.is-user]:rounded-2xl',
    'group-[.is-user]:rounded-br-md',
    'group-[.is-user]:bg-[#2E4BFF]',
    'group-[.is-user]:text-white',
    'group-[.is-user]:px-4',
    'group-[.is-user]:py-2.5',

    'group-[.is-assistant]:bg-white',
    'group-[.is-assistant]:border',
    'group-[.is-assistant]:border-[#E5E8EE]',
    'group-[.is-assistant]:rounded-2xl',
    'group-[.is-assistant]:rounded-bl-md',
    'group-[.is-assistant]:text-[#0A0E1A]',
    'group-[.is-assistant]:px-4',
    'group-[.is-assistant]:py-3',
    'group-[.is-assistant]:[font-family:var(--font-body)]',

    'text-[13px]',
    'leading-[1.7]',
    'break-words',
    'whitespace-pre-wrap',

    'group-[.is-user]:max-w-[85%]',
    'sm:group-[.is-user]:max-w-[62ch]',
    'md:group-[.is-user]:max-w-[68ch]',
    'lg:group-[.is-user]:max-w-[72ch]',

    '[&_a]:text-current',
    '[&_a]:underline',
    '[&_a]:underline-offset-2',

    'group-[.is-user_a]:text-white/90',
    'group-[.is-user_a]:decoration-white/50',
    'group-[.is-user_a]:hover:text-white',

    'group-[.is-assistant_a]:text-[#2E4BFF]',
    'group-[.is-assistant_a]:decoration-[#2E4BFF]/40',
    'group-[.is-assistant_a]:hover:text-[#2E4BFF]',

    '[&_code]:bg-[#F0F2F6]',
    '[&_code]:px-1.5',
    '[&_code]:py-0.5',
    '[&_code]:rounded',
    '[&_code]:text-[12px]',
    '[&_code]:font-mono',
    '[&_code]:text-[#E5484D]',
    '[&_code]:before:content-none',
    '[&_code]:after:content-none',

    'group-[.is-user_code]:bg-white/15',
    'group-[.is-user_code]:text-white',

    'group-[.is-assistant_strong]:text-[#0A0E1A]',
    'group-[.is-user_strong]:text-white',

    '[&_hr]:border-[#E5E8EE]',
    '[&_hr]:my-4',
    '[&_blockquote]:border-l-2',
    '[&_blockquote]:border-[#D8DCE5]',
    '[&_blockquote]:pl-3',
    '[&_blockquote]:text-[#5A6478]',
    '[&_blockquote]:italic',
  ].join(' ')
}
