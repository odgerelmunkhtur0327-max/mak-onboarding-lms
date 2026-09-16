export type VideoType = 'youtube' | 'vimeo' | 'sharepoint' | 'mp4' | 'none'

export function detectVideoType(url: string): VideoType {
  if (!url) return 'none'
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube'
  if (url.includes('vimeo.com')) return 'vimeo'
  if (url.includes('sharepoint.com') || url.includes('1drv.ms')) return 'sharepoint'
  if (url.endsWith('.mp4') || url.includes('.mp4?')) return 'mp4'
  return 'none'
}

export function getYouTubeId(url: string): string | null {
  const patterns = [
    /youtu\.be\/([^?&]+)/,
    /youtube\.com\/watch\?v=([^&]+)/,
    /youtube\.com\/embed\/([^?&]+)/,
  ]
  for (const p of patterns) {
    const m = url.match(p)
    if (m) return m[1]
  }
  return null
}

export function getVimeoId(url: string): string | null {
  const m = url.match(/vimeo\.com\/(\d+)/)
  return m ? m[1] : null
}

export function getEmbedUrl(url: string): string | null {
  const type = detectVideoType(url)
  if (type === 'youtube') {
    const id = getYouTubeId(url)
    return id ? `https://www.youtube-nocookie.com/embed/${id}?rel=0` : null
  }
  if (type === 'vimeo') {
    const id = getVimeoId(url)
    return id ? `https://player.vimeo.com/video/${id}?dnt=1` : null
  }
  // SharePoint / OneDrive embed URLs are already iframe-ready.
  if (type === 'sharepoint') return url
  return null
}
