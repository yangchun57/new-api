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
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'

import { BannerGalleryField } from '@/features/system-settings/components/banner-gallery-field'
import { uploadHomeBanner } from '@/features/system-settings/api'

vi.mock('sonner', () => ({
  toast: { info: vi.fn(), error: vi.fn(), success: vi.fn() },
}))

vi.mock('@/features/system-settings/api', () => ({
  uploadHomeBanner: vi.fn(),
}))

const uploadHomeBannerMock = vi.mocked(uploadHomeBanner)

function getFileInput(container: HTMLElement): HTMLInputElement {
  const input = container.querySelector('input[type="file"]')
  if (!(input instanceof HTMLInputElement)) {
    throw new Error('file input not found')
  }
  return input
}

describe('BannerGalleryField', () => {
  test('rejects a non-image file without uploading', () => {
    const onChange = vi.fn()
    const { container } = render(
      <BannerGalleryField value={[]} onChange={onChange} />
    )

    const file = new File(['hello'], 'notes.txt', { type: 'text/plain' })
    fireEvent.change(getFileInput(container), { target: { files: [file] } })

    expect(uploadHomeBannerMock).not.toHaveBeenCalled()
    expect(onChange).not.toHaveBeenCalled()
  })

  test('uploads a valid image and appends the returned URL', async () => {
    uploadHomeBannerMock.mockResolvedValue('/uploads/banner/new.png')
    const onChange = vi.fn()
    const { container } = render(
      <BannerGalleryField value={['/uploads/banner/old.png']} onChange={onChange} />
    )

    const file = new File(['image-bytes'], 'banner.png', { type: 'image/png' })
    fireEvent.change(getFileInput(container), { target: { files: [file] } })

    await waitFor(() =>
      expect(onChange).toHaveBeenCalledWith([
        '/uploads/banner/old.png',
        '/uploads/banner/new.png',
      ])
    )
    expect(uploadHomeBannerMock).toHaveBeenCalledWith(file)
  })

  test('adds a pasted image URL', () => {
    const onChange = vi.fn()
    render(<BannerGalleryField value={[]} onChange={onChange} />)

    fireEvent.change(screen.getByPlaceholderText('Banner URL'), {
      target: { value: '/uploads/banner/typed.png' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))

    expect(onChange).toHaveBeenCalledWith(['/uploads/banner/typed.png'])
  })

  test('reorders banners with move down', () => {
    const onChange = vi.fn()
    render(
      <BannerGalleryField
        value={['/a.png', '/b.png']}
        onChange={onChange}
      />
    )

    fireEvent.click(screen.getAllByRole('button', { name: 'Move down' })[0])

    expect(onChange).toHaveBeenCalledWith(['/b.png', '/a.png'])
  })

  test('removes a banner', () => {
    const onChange = vi.fn()
    render(
      <BannerGalleryField
        value={['/a.png', '/b.png']}
        onChange={onChange}
      />
    )

    fireEvent.click(screen.getAllByRole('button', { name: 'Remove' })[0])

    expect(onChange).toHaveBeenCalledWith(['/b.png'])
  })
})
