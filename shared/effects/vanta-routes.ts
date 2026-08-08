export function shouldUseVantaBackground(pathname: string | null | undefined) {
  const pathSegments = pathname?.split('/').filter(Boolean) ?? []
  return pathSegments.length === 0
}
