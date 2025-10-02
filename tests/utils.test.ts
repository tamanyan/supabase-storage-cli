import { formatBytes, getContentType } from '../src/utils'

describe('utils', () => {
  describe('formatBytes', () => {
    it('should format 0 bytes', () => {
      expect(formatBytes(0)).toBe('0 B')
    })

    it('should format bytes', () => {
      expect(formatBytes(500)).toBe('500 B')
    })

    it('should format kilobytes', () => {
      expect(formatBytes(1024)).toBe('1 KB')
      expect(formatBytes(1536)).toBe('1.5 KB')
    })

    it('should format megabytes', () => {
      expect(formatBytes(1048576)).toBe('1 MB')
      expect(formatBytes(2621440)).toBe('2.5 MB')
    })

    it('should format gigabytes', () => {
      expect(formatBytes(1073741824)).toBe('1 GB')
    })

    it('should format terabytes', () => {
      expect(formatBytes(1099511627776)).toBe('1 TB')
    })
  })

  describe('getContentType', () => {
    it('should return correct MIME type for images', () => {
      expect(getContentType('photo.jpg')).toBe('image/jpeg')
      expect(getContentType('photo.jpeg')).toBe('image/jpeg')
      expect(getContentType('image.png')).toBe('image/png')
      expect(getContentType('animation.gif')).toBe('image/gif')
      expect(getContentType('photo.webp')).toBe('image/webp')
    })

    it('should return correct MIME type for documents', () => {
      expect(getContentType('document.pdf')).toBe('application/pdf')
      expect(getContentType('data.json')).toBe('application/json')
      expect(getContentType('readme.txt')).toBe('text/plain')
    })

    it('should return correct MIME type for media', () => {
      expect(getContentType('video.mp4')).toBe('video/mp4')
      expect(getContentType('audio.mp3')).toBe('audio/mpeg')
    })

    it('should handle uppercase extensions', () => {
      expect(getContentType('PHOTO.JPG')).toBe('image/jpeg')
      expect(getContentType('DOCUMENT.PDF')).toBe('application/pdf')
    })

    it('should return default MIME type for unknown extensions', () => {
      expect(getContentType('file.unknown')).toBe('application/octet-stream')
      expect(getContentType('noextension')).toBe('application/octet-stream')
    })

    it('should handle files with multiple dots', () => {
      expect(getContentType('my.photo.backup.jpg')).toBe('image/jpeg')
    })
  })
})
