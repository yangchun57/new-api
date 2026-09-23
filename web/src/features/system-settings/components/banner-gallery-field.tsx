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
import { ArrowDown, ArrowUp, Loader2, Plus, Trash2, Upload } from 'lucide-react'
import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import { uploadHomeBanner } from '../api'

const MAX_HOME_BANNERS = 20
const MAX_BANNER_SIZE = 5 * 1024 * 1024
const ALLOWED_BANNER_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
])

interface BannerGalleryFieldProps {
  value: string[]
  onChange: (value: string[]) => void
  disabled?: boolean
}

export function BannerGalleryField(props: BannerGalleryFieldProps) {
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [urlDraft, setUrlDraft] = useState('')

  const banners = props.value ?? []
  const canAddMore = banners.length < MAX_HOME_BANNERS

  const handleSelectFiles = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = [...(event.target.files ?? [])]
    event.target.value = ''
    if (files.length === 0) return

    if (!canAddMore) {
      toast.error(t('At most {{count}} banners', { count: MAX_HOME_BANNERS }))
      return
    }

    const remaining = MAX_HOME_BANNERS - banners.length
    const accepted: File[] = []
    for (const file of files) {
      if (!ALLOWED_BANNER_TYPES.has(file.type)) {
        toast.error(t('Please select an image file'))
        continue
      }
      if (file.size > MAX_BANNER_SIZE) {
        toast.error(t('Image size must not exceed 5MB'))
        continue
      }
      accepted.push(file)
      if (accepted.length >= remaining) break
    }
    if (accepted.length === 0) return

    setIsUploading(true)
    try {
      const uploaded: string[] = []
      for (const file of accepted) {
        uploaded.push(await uploadHomeBanner(file))
      }
      props.onChange([...banners, ...uploaded])
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t('Failed to upload banner')
      )
    } finally {
      setIsUploading(false)
    }
  }

  const handleAddUrl = () => {
    const url = urlDraft.trim()
    if (!url) return
    if (!canAddMore) {
      toast.error(t('At most {{count}} banners', { count: MAX_HOME_BANNERS }))
      return
    }
    if (!url.startsWith('/') && !/^https?:\/\//.test(url)) {
      toast.error(t('Banner URL must start with / or http(s)://'))
      return
    }
    if (banners.includes(url)) {
      toast.error(t('This banner has already been added'))
      return
    }
    props.onChange([...banners, url])
    setUrlDraft('')
  }

  const moveBanner = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= banners.length) return
    const next = [...banners]
    next[index] = banners[target]
    next[target] = banners[index]
    props.onChange(next)
  }

  const removeBanner = (index: number) => {
    props.onChange(banners.filter((_, itemIndex) => itemIndex !== index))
  }

  return (
    <div className='space-y-3'>
      <div className='flex flex-wrap items-center gap-3'>
        <input
          ref={inputRef}
          type='file'
          multiple
          accept='image/png,image/jpeg,image/gif,image/webp'
          className='hidden'
          onChange={handleSelectFiles}
        />
        <Button
          type='button'
          variant='outline'
          size='sm'
          disabled={props.disabled || isUploading || !canAddMore}
          onClick={() => inputRef.current?.click()}
        >
          {isUploading ? (
            <Loader2 className='mr-2 h-4 w-4 animate-spin' />
          ) : (
            <Upload className='mr-2 h-4 w-4' />
          )}
          {isUploading ? t('Uploading...') : t('Upload banner')}
        </Button>
        <span className='text-muted-foreground text-xs'>
          {t('{{count}}/{{max}} banners', {
            count: banners.length,
            max: MAX_HOME_BANNERS,
          })}
        </span>
      </div>

      <div className='flex items-center gap-2'>
        <Input
          value={urlDraft}
          disabled={props.disabled || !canAddMore}
          placeholder={t('Banner URL')}
          onChange={(event) => setUrlDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              handleAddUrl()
            }
          }}
        />
        <Button
          type='button'
          variant='outline'
          size='sm'
          disabled={props.disabled || !canAddMore || !urlDraft.trim()}
          onClick={handleAddUrl}
        >
          <Plus className='mr-1 h-4 w-4' />
          {t('Add')}
        </Button>
      </div>

      {banners.length === 0 ? (
        <div className='border-border text-muted-foreground flex h-32 items-center justify-center rounded-xl border border-dashed text-sm'>
          {t('No banner uploaded yet')}
        </div>
      ) : (
        <ul className='space-y-2'>
          {banners.map((url, index) => (
            <li
              key={url}
              className='border-border bg-muted/20 flex items-center gap-3 rounded-xl border p-2'
            >
              <img
                src={url}
                alt={t('Banner preview')}
                className='h-12 w-24 shrink-0 rounded-lg object-cover'
              />
              <span className='text-muted-foreground min-w-0 flex-1 truncate text-xs'>
                {url}
              </span>
              <div className='flex items-center gap-1'>
                <Button
                  type='button'
                  variant='ghost'
                  size='icon-sm'
                  disabled={index === 0}
                  aria-label={t('Move up')}
                  onClick={() => moveBanner(index, -1)}
                >
                  <ArrowUp className='h-4 w-4' />
                </Button>
                <Button
                  type='button'
                  variant='ghost'
                  size='icon-sm'
                  disabled={index === banners.length - 1}
                  aria-label={t('Move down')}
                  onClick={() => moveBanner(index, 1)}
                >
                  <ArrowDown className='h-4 w-4' />
                </Button>
                <Button
                  type='button'
                  variant='ghost'
                  size='icon-sm'
                  aria-label={t('Remove')}
                  onClick={() => removeBanner(index)}
                >
                  <Trash2 className='h-4 w-4' />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
