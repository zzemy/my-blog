export const dynamic = 'force-static'
export const revalidate = false

const headers = {
  'content-type': 'text/plain; charset=utf-8',
}

export function GET() {
  return new Response('ok\n', { headers })
}

export function HEAD() {
  return new Response(null, { status: 204, headers })
}
