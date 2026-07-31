// src/util/echo.ts

export function initEcho (token: string): WebSocket {
  const wsUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL

  if (!wsUrl) {
    throw new Error('NEXT_PUBLIC_WEBSOCKET_URL is not configured')
  }

  if (!token) {
    throw new Error('WebSocket authentication token is missing')
  }

  console.log('Connecting WebSocket:', wsUrl)

  const socket = new WebSocket(wsUrl)

  socket.addEventListener('open', () => {
    console.log('✅ WebSocket connected')

    // Send authentication only after connection is established
    socket.send(
      JSON.stringify({
        sendType: 'auth',
        token: token.trim()
      })
    )

    console.log('🔐 WebSocket authentication request sent')
  })

  socket.addEventListener('message', event => {
    try {
      const data = JSON.parse(event.data)

      console.log('📨 WebSocket server response:', data)

      if (data?.sendType === 'auth_success') {
        console.log('✅ WebSocket authentication successful')
      }

      if (data?.sendType === 'auth_failed') {
        console.error('❌ WebSocket authentication failed:', data?.message)
      }
    } catch (error) {
      console.error('❌ Failed to parse WebSocket message:', error)
    }
  })

  socket.addEventListener('error', error => {
    console.error('❌ WebSocket error:', error)
  })

  socket.addEventListener('close', event => {
    console.log('🔌 WebSocket disconnected:', {
      code: event.code,
      reason: event.reason
    })
  })

  return socket
}
