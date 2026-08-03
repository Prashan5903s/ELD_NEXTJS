'use client'

import moment from 'moment-timezone'
import { useSession } from 'next-auth/react'
import Skeleton from 'react-loading-skeleton'
import { useState, useEffect, useRef } from 'react'

export default function ChatWindow ({
  id,
  data,
  isGroup,
  selectId,
  selectedChat
}) {
  const socketRef = useRef(null)
  const chatKeyRef = useRef(null)

  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState([])
  const [messagesLoaded, setMessagesLoaded] = useState(false)
  const [imagePreview, setImagePreview] = useState(null)
  const [uploadedImageUrl, setUploadedImageUrl] = useState(null)
  const [uploadStatus, setUploadStatus] = useState('')

  const { data: session } = useSession()

  const token = session?.user?.token

  const webSocketUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL
  const url = process.env.NEXT_PUBLIC_BACKEND_API_URL

  const getSaltLakeCityTime = () => {
    return moment().tz('America/Denver').format('YYYY-MM-DD HH:mm:ss Z')
  }

  useEffect(() => {
    setMessages([])
    setMessagesLoaded(false)
    setMessage('')
    setImagePreview(null)
    setUploadedImageUrl(null)
    setUploadStatus('')

    if (socketRef.current) {
      try {
        socketRef.current.close()
      } catch (error) {
        console.error('Error closing previous WebSocket:', error)
      }

      socketRef.current = null
    }

    if (!selectedChat || !id || !selectId || !token || !webSocketUrl) {
      return
    }

    const currentChatKey = `${id}-${selectId}-${Boolean(isGroup)}`

    chatKeyRef.current = currentChatKey

    let isActive = true

    const socket = new WebSocket(webSocketUrl)

    socketRef.current = socket

    socket.onopen = () => {
      if (!isActive || chatKeyRef.current !== currentChatKey) {
        socket.close()

        return
      }

      socket.send(
        JSON.stringify({
          sendType: 'auth',
          token
        })
      )
    }

    socket.onmessage = event => {
      if (!isActive || chatKeyRef.current !== currentChatKey) {
        return
      }

      try {
        const response = JSON.parse(event.data)

        if (response.sendType === 'auth_success') {
          if (socket.readyState !== WebSocket.OPEN) {
            return
          }

          socket.send(
            JSON.stringify({
              sendType: 'update_read_status',
              receiverId: Number(selectId),
              isGroup: Boolean(isGroup)
            })
          )

          socket.send(
            JSON.stringify({
              sendType: 'get_previous_messages',
              receiverId: Number(selectId),
              isGroup: Boolean(isGroup)
            })
          )

          return
        }

        if (
          response.sendType === 'auth_failed' ||
          response.sendType === 'auth_expired' ||
          response.sendType === 'auth_required' ||
          response.sendType === 'auth_mismatch'
        ) {
          console.error('WebSocket authentication error:', response.message)

          return
        }

        if (response.sendType === 'previous_messages_loaded') {
          setMessagesLoaded(true)

          return
        }

        if (response.sendType === 'previous_message') {
          const senderId = Number(response.sender_id)

          const receiverId = Number(
            response.receiver_id || response.reciever_id || 0
          )

          const groupId = Number(response.group_id || 0)

          if (Number(response.type) === 0) {
            const isCurrentConversation =
              (senderId === Number(id) && receiverId === Number(selectId)) ||
              (senderId === Number(selectId) && receiverId === Number(id))

            if (!isCurrentConversation) {
              return
            }
          }

          if (Number(response.type) === 1 && groupId !== Number(selectId)) {
            return
          }

          setMessages(prev => {
            const exists = prev.some(
              item => Number(item.id) === Number(response.id)
            )

            if (exists) {
              return prev
            }

            return [
              ...prev,
              {
                id: response.id,
                type: Number(response.type),
                text: response.content || '',
                sender: senderId,
                receiver_id: receiverId,
                group_id: groupId,
                sender_name: response.sender_name || 'Unknown',
                receiver_name:
                  response.receiver_name || response.reciever_name || '',
                reciever_name:
                  response.reciever_name || response.receiver_name || '',
                image_url: response.image_url || null,
                sent_time: response.sent_time,
                DataMethod: 1
              }
            ]
          })

          return
        }

        if (response.sendType === 'new_message') {
          const senderId = Number(response.sender_id)

          const receiverId = Number(
            response.receiver_id || response.reciever_id || 0
          )

          const groupId = Number(response.group_id || 0)

          if (Number(response.type) === 0) {
            const isCurrentConversation =
              (senderId === Number(id) && receiverId === Number(selectId)) ||
              (senderId === Number(selectId) && receiverId === Number(id))

            if (!isCurrentConversation) {
              return
            }
          }

          if (Number(response.type) === 1 && groupId !== Number(selectId)) {
            return
          }

          setMessages(prev => {
            const exists = prev.some(
              item => Number(item.id) === Number(response.id)
            )

            if (exists) {
              return prev
            }

            return [
              ...prev,
              {
                id: response.id,
                type: Number(response.type),
                text: response.content || '',
                sender: senderId,
                receiver_id: receiverId,
                group_id: groupId,
                sender_name: response.sender_name || 'Unknown',
                receiver_name:
                  response.receiver_name || response.reciever_name || '',
                reciever_name:
                  response.reciever_name || response.receiver_name || '',
                image_url: response.image_url || null,
                sent_time: response.sent_time,
                DataMethod: 2
              }
            ]
          })

          return
        }

        if (response.sendType === 'message_read_status') {
          return
        }

        if (response.sendType === 'totalMsg') {
          return
        }

        if (response.type === 'error') {
          console.error(
            `WebSocket error [${response.sendType}]:`,
            response.message
          )

          return
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error)
      }
    }

    socket.onclose = () => {
      if (chatKeyRef.current === currentChatKey) {
        socketRef.current = null
      }
    }

    socket.onerror = error => {
      if (chatKeyRef.current === currentChatKey) {
        console.error('WebSocket error:', error)
      }
    }

    return () => {
      isActive = false

      if (chatKeyRef.current === currentChatKey) {
        chatKeyRef.current = null
      }

      if (socketRef.current === socket) {
        socketRef.current = null
      }

      if (
        socket.readyState === WebSocket.OPEN ||
        socket.readyState === WebSocket.CONNECTING
      ) {
        socket.close()
      }
    }
  }, [id, selectId, selectedChat, isGroup, token, webSocketUrl])

  const handleSendMessage = e => {
    e.preventDefault()

    const content = message.trim()

    if (!content && !uploadedImageUrl) {
      return
    }

    if (!id || !selectId) {
      return
    }

    const socket = socketRef.current

    if (!socket || socket.readyState !== WebSocket.OPEN) {
      console.error('WebSocket is not connected')

      return
    }

    const messageData = {
      sendType: 'message',
      type: isGroup ? 1 : 0,
      receiver_id: Number(selectId),
      content,
      image_url: uploadedImageUrl || null,
      sent_time: getSaltLakeCityTime(),
      master_id: 95,
      master_company_id: 94
    }

    console.log('Sending WebSocket message:', messageData)

    socket.send(JSON.stringify(messageData))

    setMessage('')
    setImagePreview(null)
    setUploadedImageUrl(null)
    setUploadStatus('')
  }

  const saveFile = async file => {
    if (!token) {
      console.error('Authentication token is missing')

      setUploadStatus('Authentication token is missing.')

      return null
    }

    const formData = new FormData()

    formData.append('image', file)

    try {
      const uploadUrl = `${url}/save/image/message`

      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json'
        },
        body: formData
      })

      const responseData = await response.json()

      console.log('Upload response:', responseData)

      if (!response.ok) {
        throw new Error(
          responseData.message ||
            `File upload failed with status ${response.status}`
        )
      }

      if (!responseData.image_url) {
        throw new Error('Image URL was not returned by the server')
      }

      console.log('Uploaded image URL:', responseData.image_url)

      setUploadStatus('')

      return responseData.image_url
    } catch (error) {
      console.error('Error uploading file:', error)

      setUploadStatus(error.message || 'Failed: An error occurred.')

      return null
    }
  }

  const handleImageSelect = async e => {
    const file = e.target.files?.[0]

    if (!file) {
      return
    }

    setUploadStatus('Uploading...')

    const localPreview = URL.createObjectURL(file)

    setImagePreview(localPreview)
    setUploadedImageUrl(null)

    const uploadedUrl = await saveFile(file)

    if (uploadedUrl) {
      setUploadedImageUrl(uploadedUrl)
      setUploadStatus('')
    } else {
      setImagePreview(null)
      setUploadedImageUrl(null)
    }

    e.target.value = ''
  }

  const handleRemoveImage = () => {
    setImagePreview(null)
    setUploadedImageUrl(null)
    setUploadStatus('')
  }

  return (
    <div className='flex-lg-row-fluid ms-lg-7 ms-xl-10'>
      {selectedChat ? (
        <div className='card' id='kt_chat_messenger'>
          <div className='card-header' id='kt_chat_messenger_header'>
            <div className='card-title'>
              <div className='d-flex justify-content-center flex-column me-3'>
                <div>{data || ''}</div>
              </div>
            </div>
          </div>

          <div className='card-body' id='kt_chat_messenger_body'>
            <div
              className='scroll-y me-n5 pe-5 h-300px h-lg-auto'
              data-kt-element='messages'
            >
              {!messagesLoaded ? (
                [...Array(5)].map((_, index) => (
                  <div key={index} className='mb-10'>
                    <Skeleton width={400} height={50} />

                    <Skeleton width={400} height={30} />
                  </div>
                ))
              ) : messages.length === 0 ? (
                <div className='d-flex align-items-center justify-content-center h-100'>
                  <div className='text-muted text-center'>No messages yet</div>
                </div>
              ) : (
                messages.map((msg, index) => {
                  const isMine = Number(msg.sender) === Number(id)

                  const messageDate = new Date(msg.sent_time)

                  const formattedTime = Number.isNaN(messageDate.getTime())
                    ? ''
                    : new Intl.DateTimeFormat('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true,
                        timeZone: 'America/Denver'
                      }).format(messageDate)

                  return (
                    <div key={msg.id || index}>
                      <div
                        className={`d-flex ${
                          isMine
                            ? 'justify-content-end'
                            : 'justify-content-start'
                        } mb-10`}
                      >
                        <div className='d-flex flex-column align-items-start'>
                          <div className='d-flex align-items-center mb-2'>
                            <div className='ms-3'>
                              <a
                                href='#'
                                onClick={e => e.preventDefault()}
                                style={{
                                  textDecoration: 'none'
                                }}
                                className='fs-5 fw-bold text-gray-900 me-1'
                              >
                                {isMine ? 'You' : msg.sender_name || 'Unknown'}
                              </a>

                              <span className='text-muted fs-7 mb-1'>
                                {formattedTime}
                              </span>
                            </div>
                          </div>

                          <div
                            className={`p-5 rounded ${
                              isMine ? 'bg-light-primary' : 'bg-light-info'
                            } text-gray-900 fw-semibold mw-lg-400px text-start`}
                          >
                            {msg.image_url && (
                              <div className='mb-2'>
                                <img
                                  src={msg.image_url}
                                  alt='Sent'
                                  style={{
                                    maxWidth: '100%',
                                    maxHeight: '200px',
                                    borderRadius: '8px',
                                    display: 'block',
                                    objectFit: 'contain'
                                  }}
                                  onError={e => {
                                    console.error(
                                      'Image failed to load:',
                                      msg.image_url
                                    )

                                    e.currentTarget.style.display = 'none'
                                  }}
                                />
                              </div>
                            )}

                            {msg.text && <div>{msg.text}</div>}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}

              {imagePreview && (
                <div className='d-flex justify-content-end mb-3'>
                  <div className='image-preview p-3 rounded bg-light-primary position-relative'>
                    <img
                      src={imagePreview}
                      alt='Preview'
                      className='img-fluid rounded'
                      style={{
                        maxWidth: '100%',
                        maxHeight: '200px',
                        display: 'block'
                      }}
                    />

                    {uploadStatus && (
                      <div className='text-muted small mt-2'>
                        {uploadStatus}
                      </div>
                    )}

                    <button
                      type='button'
                      onClick={handleRemoveImage}
                      className='btn btn-sm btn-icon position-absolute top-0 end-0'
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div
            className='card-footer pt-4'
            id='kt_drawer_chat_messenger_footer'
          >
            <form
              onSubmit={handleSendMessage}
              className='d-flex align-items-center mt-3'
              style={{
                gap: '10px'
              }}
            >
              <textarea
                className='form-control me-2'
                rows='1'
                onChange={e => setMessage(e.target.value)}
                value={message}
                placeholder='Type a message...'
              />

              <div className='d-flex align-items-center'>
                <div className='btn-group me-2'>
                  <label
                    htmlFor='imageInput'
                    className='btn btn-secondary btn-sm'
                  >
                    Attach
                  </label>

                  <input
                    id='imageInput'
                    type='file'
                    accept='image/*'
                    onChange={handleImageSelect}
                    className='d-none'
                  />
                </div>

                <button
                  className='btn btn-primary btn-sm'
                  type='submit'
                  disabled={
                    Boolean(uploadStatus === 'Uploading...') ||
                    (!message.trim() && !uploadedImageUrl)
                  }
                >
                  Send
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        <div className='d-flex align-item-center justify-content-center'>
          <img src='/logo/chat.png' alt='' />
        </div>
      )}
    </div>
  )
}
