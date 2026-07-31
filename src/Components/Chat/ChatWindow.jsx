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

  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState([])
  const [imagePreview, setImagePreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState('')

  const { data: session } = useSession()

  const token = session?.user?.token

  const webSocketUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL
  const url = process.env.NEXT_PUBLIC_BACKEND_API_URL

  const getSaltLakeCityTime = () => {
    return moment().tz('America/Denver').format('YYYY-MM-DD HH:mm:ss Z')
  }

  // =====================================================
  // WEBSOCKET
  // =====================================================

  useEffect(() => {
    if (!selectedChat || !id || !selectId || !token) {
      return
    }

    console.log('Connecting WebSocket:', webSocketUrl)

    const socket = new WebSocket(webSocketUrl)

    socketRef.current = socket

    socket.onopen = () => {
      console.log('WebSocket connected')

      // IMPORTANT:
      // Send token during authentication
      socket.send(
        JSON.stringify({
          sendType: 'auth',
          token: token
        })
      )
    }

    socket.onmessage = event => {
      try {
        const data = JSON.parse(event.data)

        console.log('WebSocket message:', data)

        // =================================================
        // AUTH SUCCESS
        // =================================================

        if (data.sendType === 'auth_success') {
          console.log('WebSocket authenticated')

          // Now authentication is complete.
          // It is safe to send authenticated requests.

          socket.send(
            JSON.stringify({
              sendType: 'update_read_status',
              receiverId: selectId,
              isGroup: Boolean(isGroup)
            })
          )

          // Load previous messages
          socket.send(
            JSON.stringify({
              sendType: 'get_previous_messages',
              receiverId: selectId,
              isGroup: Boolean(isGroup)
            })
          )

          // Load unread messages if required
          socket.send(
            JSON.stringify({
              sendType: 'totalMsg'
            })
          )

          return
        }

        // =================================================
        // AUTH ERROR
        // =================================================

        if (
          data.sendType === 'auth_failed' ||
          data.sendType === 'auth_expired' ||
          data.sendType === 'auth_required'
        ) {
          console.error('WebSocket authentication error:', data.message)

          return
        }

        // =================================================
        // PREVIOUS MESSAGE
        // =================================================

        if (data.sendType === 'previous_message') {
          setMessages(prev => [
            ...prev,
            {
              id: data.id,
              text: data.content || '',
              sender: Number(data.sender_id),
              sender_name: data.sender_name,
              reciever_name: data.reciever_name,
              image_url: data.image_url,
              sent_time: data.sent_time,
              DataMethod: 1
            }
          ])

          return
        }

        // =================================================
        // NEW MESSAGE
        // =================================================

        if (data.sendType === 'new_message') {
          const senderId = Number(data.sender_id)
          const receiverId = Number(data.receiver_id || data.reciever_id)

          // ONE-TO-ONE
          if (Number(data.type) === 0) {
            const isCurrentConversation =
              (senderId === Number(id) && receiverId === Number(selectId)) ||
              (senderId === Number(selectId) && receiverId === Number(id))

            if (!isCurrentConversation) {
              return
            }
          }

          // GROUP
          if (Number(data.type) === 1) {
            if (Number(data.group_id) !== Number(selectId)) {
              return
            }
          }

          setMessages(prev => [
            ...prev,
            {
              id: data.id,
              text: data.content || '',
              sender: senderId,
              sender_name: data.sender_name,
              reciever_name: data.reciever_name,
              image_url: data.image_url,
              sent_time: data.sent_time,
              DataMethod: 2
            }
          ])

          return
        }

        // =================================================
        // TOTAL UNREAD
        // =================================================

        if (data.sendType === 'totalMsg') {
          console.log('Unread message:', data)

          return
        }

        // =================================================
        // READ STATUS
        // =================================================

        if (data.sendType === 'message_read_status') {
          console.log('Read status updated:', data)

          return
        }

        // =================================================
        // ERROR
        // =================================================

        if (data.type === 'error') {
          console.error(`WebSocket error [${data.sendType}]:`, data.message)

          return
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error)
      }
    }

    socket.onclose = event => {
      console.log('WebSocket closed:', event.code, event.reason)
    }

    socket.onerror = error => {
      console.error('WebSocket error:', error)
    }

    return () => {
      console.log('Closing WebSocket')

      socket.close()

      socketRef.current = null
    }
  }, [id, selectId, selectedChat, isGroup, token, webSocketUrl])

  // =====================================================
  // SEND MESSAGE
  // =====================================================

  const handleSendMessage = e => {
    e.preventDefault()

    const content = message.trim()

    if (!content && !imagePreview) {
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

      content: content,

      image_url: imagePreview || null,

      sent_time: getSaltLakeCityTime(),

      master_id: 95,

      master_company_id: 94
    }

    console.log('Sending message:', messageData)

    socket.send(JSON.stringify(messageData))

    // DO NOT manually add the message here.
    //
    // Backend sends "new_message" back to sender.
    // Otherwise you will see the same message twice.

    setMessage('')

    setImagePreview(null)
  }

  // =====================================================
  // IMAGE UPLOAD
  // =====================================================

  const saveFile = async file => {
    const formData = new FormData()

    formData.append('file', file)

    try {
      const response = await fetch(`${url}/save/image/message`, {
        method: 'POST',

        headers: {
          Authorization: `Bearer ${token}`
        },

        body: formData
      })

      if (!response.ok) {
        throw new Error('File upload failed')
      }

      const data = await response.json()

      setImagePreview(data.file_path)
    } catch (error) {
      console.error('Error uploading file:', error)

      setUploadStatus('Failed: An error occurred.')
    }
  }

  const handleImageSelect = e => {
    const file = e.target.files?.[0]

    if (!file) {
      return
    }

    const reader = new FileReader()

    reader.onload = () => {
      setImagePreview(reader.result)
    }

    reader.readAsDataURL(file)

    saveFile(file)
  }

  useEffect(() => {
    setLoading(messages.length > 0)
  }, [messages])

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
              {!loading && messages.length === 0
                ? [...Array(5)].map((_, index) => (
                    <div key={index} className='mb-10'>
                      <Skeleton width={400} height={50} />

                      <Skeleton width={400} height={30} />
                    </div>
                  ))
                : messages.map((msg, index) => {
                    const isMine = Number(msg.sender) === Number(id)

                    const formattedTime = new Intl.DateTimeFormat('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true,
                      timeZone: 'America/Denver'
                    }).format(new Date(msg.sent_time))

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
                                  {isMine
                                    ? 'You'
                                    : msg.sender_name || 'Unknown'}
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
                                <img
                                  src={msg.image_url}
                                  alt='Sent'
                                  style={{
                                    maxWidth: '100%',
                                    maxHeight: '200px',
                                    borderRadius: '8px',
                                    marginTop: '5px'
                                  }}
                                />
                              )}

                              {msg.text && <div>{msg.text}</div>}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}

              {imagePreview && (
                <div className='d-flex justify-content-end mb-3'>
                  <div className='image-preview p-3 rounded bg-light-primary position-relative'>
                    <img
                      src={imagePreview}
                      alt='Preview'
                      className='img-fluid rounded'
                      style={{
                        maxWidth: '100%',
                        maxHeight: '200px'
                      }}
                    />

                    <button
                      type='button'
                      onClick={() => setImagePreview(null)}
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

                <button className='btn btn-primary btn-sm' type='submit'>
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
