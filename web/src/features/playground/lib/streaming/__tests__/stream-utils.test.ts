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
import { describe, expect, test } from 'vitest'

import { ERROR_MESSAGES } from '../../../constants'
import { parseStreamErrorDetails } from '../stream-utils'

describe('parseStreamErrorDetails', () => {
  test('extracts message and code from an OpenAI-style error payload', () => {
    const details = parseStreamErrorDetails(
      JSON.stringify({
        error: {
          code: 'invalid_request_error',
          message: 'this model does not support image input',
        },
      })
    )

    expect(details.errorCode).toBe('invalid_request_error')
    expect(details.errorMessage).toBe('this model does not support image input')
  })

  test('falls back to a generic message when the body is empty', () => {
    const details = parseStreamErrorDetails('')

    expect(details.errorMessage).toBe(ERROR_MESSAGES.API_REQUEST_ERROR)
    expect(details.errorCode).toBeUndefined()
  })

  test('falls back to a generic message when the body is whitespace only', () => {
    const details = parseStreamErrorDetails('   \n\t ')

    expect(details.errorMessage).toBe(ERROR_MESSAGES.API_REQUEST_ERROR)
  })

  test('falls back to a generic message when the payload has no error field', () => {
    const details = parseStreamErrorDetails('{"foo":"bar"}')

    expect(details.errorMessage).toBe(ERROR_MESSAGES.API_REQUEST_ERROR)
  })

  test('falls back to a generic message when the error message is blank', () => {
    const details = parseStreamErrorDetails(
      JSON.stringify({ error: { code: 'e', message: '   ' } })
    )

    expect(details.errorMessage).toBe(ERROR_MESSAGES.API_REQUEST_ERROR)
  })

  test('falls back to a generic message when the body is not JSON', () => {
    const details = parseStreamErrorDetails('data: {"error":{"message":"x"}}')

    expect(details.errorMessage).toBe(ERROR_MESSAGES.API_REQUEST_ERROR)
  })
})
