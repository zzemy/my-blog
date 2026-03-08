import { ImageResponse } from 'next/og'
 
export const runtime = 'edge'
 
export const alt = 'emmm Blog'
export const size = {
  width: 1200,
  height: 630,
}
 
export const contentType = 'image/png'
 
export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 48,
          background: '#09090b', // zinc-950
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: 40,
          }}
        >
           <div
            style={{
              width: 60,
              height: 60,
              borderRadius: 12,
              background: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 24,
              color: 'black',
              fontSize: 36,
              fontWeight: 'bold',
            }}
          >
            &gt;_
          </div>
          <span style={{ fontSize: 48, fontWeight: 'bold', color: '#e4e4e7' }}>emmm</span>
        </div>

        <div
          style={{
            fontSize: 32,
            color: '#a1a1aa', // zinc-400
            textAlign: 'center',
            maxWidth: '80%',
          }}
        >
          A personal blog about technology and life.
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
