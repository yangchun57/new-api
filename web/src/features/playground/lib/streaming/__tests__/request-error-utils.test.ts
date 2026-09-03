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
import { parseRequestErrorDetails } from '../request-error-utils'

describe('parseRequestErrorDetails', () => {
  test('extracts a top-level response message', () => {
    const details = parseRequestErrorDetails({
      response: { data: { message: 'something went wrong' } },
    })

    expect(details.errorMessage).toBe('something went wrong')
  })

  test('extracts message nested under an OpenAI-style error object', () => {
    const details = parseRequestErrorDetails({
      response: {
        data: {
          error: {
            code: 'bad_request',
            message: 'this model does not support image input',
          },
        },
      },
    })

    expect(details.errorCode).toBe('bad_request')
    expect(details.errorMessage).toBe(
      'this model does not support image input'
    )
  })

  test('extracts the axios error message when there is no response body', () => {
    const details = parseRequestErrorDetails({
      message: 'Network Error',
    })

    expect(details.errorMessage).toBe('Network Error')
  })

  test('falls back to a generic message for an empty error object', () => {
    const details = parseRequestErrorDetails({})

    expect(details.errorMessage).toBe(ERROR_MESSAGES.API_REQUEST_ERROR)
  })

  test('falls back to a generic message when the extracted message is blank', () => {
    const details = parseRequestErrorDetails({
      response: { data: { message: '   ' } },
    })

    expect(details.errorMessage).toBe(ERROR_MESSAGES.API_REQUEST_ERROR)
  })
})
