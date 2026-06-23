const vantaEnabledSections = new Set(['components', 'guestbook', 'tags'])

export function shouldUseVantaBackground(pathname: string | null | undefined) {
  const pathSegments = pathname?.split('/').filter(Boolean) ?? []
  if (pathSegments.length === 0) return true

  const section = pathSegments[0]
  if (section === 'about') return false
  if (section === 'posts') return pathSegments.length === 1

  return vantaEnabledSections.has(section)
}
