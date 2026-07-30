export function initEcho (token: string, userId: number) {
  const wsUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL

  if (!wsUrl) {
    throw new Error('NEXT_PUBLIC_WEBSOCKET_URL is not configured')
  }

  const socket = new WebSocket(wsUrl)

  socket.onopen = () => {
    console.log('✅ WebSocket connected')

    // Register/authenticate the current user
    socket.send(
      JSON.stringify({
        sendType: 'auth',
        senderId: userId,
        token
      })
    )
  }

  socket.onclose = event => {
    console.log('🔌 WebSocket disconnected', event.code, event.reason)
  }

  socket.onerror = error => {
    console.error('❌ WebSocket error:', error)
  }

  return socket
}
