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
import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { getCaptcha } from '@/features/auth/api'
import { useCaptcha } from '@/features/auth/hooks/use-captcha'
import { useStatus } from '@/hooks/use-status'

vi.mock('sonner', () => ({
  toast: { info: vi.fn(), error: vi.fn(), success: vi.fn() },
}))

vi.mock('@/features/auth/api', () => ({
  getCaptcha: vi.fn(),
}))

vi.mock('@/hooks/use-status', () => ({
  useStatus: vi.fn(),
}))

const getCaptchaMock = vi.mocked(getCaptcha)
const useStatusMock = vi.mocked(useStatus)

function mockStatus(captchaEnabled: boolean) {
  useStatusMock.mockReturnValue({
    status: { captcha_enabled: captchaEnabled },
    loading: false,
    error: null,
  } as ReturnType<typeof useStatus>)
}

describe('useCaptcha', () => {
  beforeEach(() => {
    getCaptchaMock.mockResolvedValue({
      captcha_id: 'captcha-1',
      captcha_image: 'data:image/png;base64,AAAA',
    })
  })

  test('loads a challenge when captcha is enabled', async () => {
    mockStatus(true)
    const { result } = renderHook(() => useCaptcha())

    await waitFor(() => expect(result.current.captchaId).toBe('captcha-1'))
    expect(result.current.isCaptchaEnabled).toBe(true)
    expect(result.current.captchaImage).toBe('data:image/png;base64,AAAA')
  })

  test('does not request a challenge when captcha is disabled', () => {
    mockStatus(false)
    const { result } = renderHook(() => useCaptcha())

    expect(result.current.isCaptchaEnabled).toBe(false)
    expect(getCaptchaMock).not.toHaveBeenCalled()
  })

  test('requires a code only when captcha is enabled', async () => {
    mockStatus(true)
    const { result } = renderHook(() => useCaptcha())

    await waitFor(() => expect(result.current.captchaId).toBe('captcha-1'))
    expect(result.current.validateCaptcha('')).toBe(false)
    expect(result.current.validateCaptcha('AB2C')).toBe(true)
  })

  test('accepts an empty code when captcha is disabled', () => {
    mockStatus(false)
    const { result } = renderHook(() => useCaptcha())

    expect(result.current.validateCaptcha('')).toBe(true)
  })
})
