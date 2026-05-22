import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import FileDropzone from '../FileDropzone.vue'

function imageFile(name = 'meal.png', sizeBytes = 1024, type = 'image/png'): File {
  return new File([new Uint8Array(sizeBytes)], name, { type })
}

function buildDataTransfer(files: File[]): DataTransfer {
  return { files } as unknown as DataTransfer
}

describe('FileDropzone', () => {
  let createUrlSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    createUrlSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:fake-url')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
  })

  afterEach(() => {
    createUrlSpy.mockRestore()
    vi.restoreAllMocks()
  })

  it('renders a labelled drop area with hidden file input', () => {
    const wrapper = mount(FileDropzone)

    expect(wrapper.find('[data-testid="dropzone"]').exists()).toBe(true)
    expect(wrapper.find('input[type="file"]').exists()).toBe(true)
    expect(wrapper.find('input[type="file"]').attributes('accept')).toContain('image/')
  })

  it('emits "file" with the selected file when the user picks one via the input', async () => {
    const wrapper = mount(FileDropzone)
    const file = imageFile()

    const input = wrapper.find('input[type="file"]').element as HTMLInputElement
    Object.defineProperty(input, 'files', { value: [file], configurable: true })
    await wrapper.find('input[type="file"]').trigger('change')

    const events = wrapper.emitted('file')
    expect(events).toBeTruthy()
    expect(events?.[0]?.[0]).toBe(file)
  })

  it('emits "file" when a file is dropped onto the zone', async () => {
    const wrapper = mount(FileDropzone)
    const file = imageFile()

    await wrapper.find('[data-testid="dropzone"]').trigger('drop', {
      dataTransfer: buildDataTransfer([file]),
    })

    const events = wrapper.emitted('file')
    expect(events).toBeTruthy()
    expect(events?.[0]?.[0]).toBe(file)
  })

  it('rejects non-image files with a type error', async () => {
    const wrapper = mount(FileDropzone)
    const pdf = imageFile('doc.pdf', 1024, 'application/pdf')

    await wrapper.find('[data-testid="dropzone"]').trigger('drop', {
      dataTransfer: buildDataTransfer([pdf]),
    })

    expect(wrapper.emitted('file')).toBeUndefined()
    const errEvents = wrapper.emitted('error')
    expect(errEvents).toBeTruthy()
    expect(errEvents?.[0]?.[0]).toMatchObject({ reason: 'type' })
  })

  it('rejects files larger than 10 MB with a size error', async () => {
    const wrapper = mount(FileDropzone)
    const tooLarge = imageFile('big.jpg', 11 * 1024 * 1024, 'image/jpeg')

    await wrapper.find('[data-testid="dropzone"]').trigger('drop', {
      dataTransfer: buildDataTransfer([tooLarge]),
    })

    expect(wrapper.emitted('file')).toBeUndefined()
    const errEvents = wrapper.emitted('error')
    expect(errEvents).toBeTruthy()
    expect(errEvents?.[0]?.[0]).toMatchObject({ reason: 'size' })
  })

  it('accepts a JPEG file at exactly 10 MB', async () => {
    const wrapper = mount(FileDropzone)
    const exact = imageFile('big.jpg', 10 * 1024 * 1024, 'image/jpeg')

    await wrapper.find('[data-testid="dropzone"]').trigger('drop', {
      dataTransfer: buildDataTransfer([exact]),
    })

    expect(wrapper.emitted('file')).toBeTruthy()
    expect(wrapper.emitted('error')).toBeUndefined()
  })

  it('shows the previewUrl prop as a preview image', () => {
    const wrapper = mount(FileDropzone, { props: { previewUrl: 'blob:preview-url' } })

    const img = wrapper.find('[data-testid="dropzone-preview"]')
    expect(img.exists()).toBe(true)
    expect(img.attributes('src')).toBe('blob:preview-url')
  })

  it('clicking the dropzone activates the hidden input', async () => {
    const wrapper = mount(FileDropzone, { attachTo: document.body })
    const input = wrapper.find('input[type="file"]').element as HTMLInputElement
    const clickSpy = vi.spyOn(input, 'click').mockImplementation(() => {})

    await wrapper.find('[data-testid="dropzone-trigger"]').trigger('click')

    expect(clickSpy).toHaveBeenCalled()
    wrapper.unmount()
  })

  it('does not invoke the file input when disabled', async () => {
    const wrapper = mount(FileDropzone, { props: { disabled: true }, attachTo: document.body })
    const input = wrapper.find('input[type="file"]').element as HTMLInputElement
    const clickSpy = vi.spyOn(input, 'click').mockImplementation(() => {})

    await wrapper.find('[data-testid="dropzone-trigger"]').trigger('click')
    await wrapper.find('[data-testid="dropzone"]').trigger('drop', {
      dataTransfer: buildDataTransfer([imageFile()]),
    })

    expect(clickSpy).not.toHaveBeenCalled()
    expect(wrapper.emitted('file')).toBeUndefined()
    wrapper.unmount()
  })
})
