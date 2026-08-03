// src/util/echo.ts

export function initEcho (token: string): WebSocket {
  const wsUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL

  if (!wsUrl) {
    throw new Error('NEXT_PUBLIC_WEBSOCKET_URL is not configured')
  }

  if (!token) {
    throw new Error('WebSocket authentication token is missing')
  }

  const socket = new WebSocket(wsUrl)

  socket.addEventListener('open', () => {

    // Send authentication only after connection is established
    socket.send(
      JSON.stringify({
        sendType: 'auth',
        token: token.trim()
      })
    )

  })

  socket.addEventListener('message', event => {
    try {
      const data = JSON.parse(event.data)

      if (data?.sendType === 'auth_success') {

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
    
  })

  return socket
}
