'use client'

import Skeleton from 'react-loading-skeleton'
import { useState, useEffect, useRef } from 'react'
import { toast } from 'react-toastify'

export default function ChatList ({
  id,
  masterId,
  token,
  setIsGroup,
  setSelectId,
  setSelectedChat,
  setData,
  searchValue
}) {
  const idSelectRef = useRef(null)
  const socketRef = useRef(null)

  const [loading, setLoading] = useState(false)
  const [unread, setUnRead] = useState({})
  const [userList, setUserList] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])

  const asset_url = process.env.NEXT_PUBLIC_ASSERT_URL
  const webSocketUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL

  useEffect(() => {
    if (!id || !masterId || !token || !webSocketUrl) {
      return
    }

    if (socketRef.current) {
      return
    }

    const socket = new WebSocket(webSocketUrl)

    socketRef.current = socket

    socket.onopen = () => {
      socket.send(
        JSON.stringify({
          sendType: 'auth',
          token
        })
      )
    }

    socket.onmessage = event => {
      try {
        const data = JSON.parse(event.data)

        if (data.sendType === 'auth_success') {
          if (socket.readyState !== WebSocket.OPEN) {
            return
          }

          socket.send(
            JSON.stringify({
              sendType: 'userInfo',
              masterId
            })
          )

          socket.send(
            JSON.stringify({
              sendType: 'totalMsg'
            })
          )

          return
        }

        if (
          data.sendType === 'auth_failed' ||
          data.sendType === 'auth_expired' ||
          data.sendType === 'auth_mismatch'
        ) {
          console.error('ChatList authentication failed:', data.message)

          return
        }

        if (
          data.sendType === 'user_list' ||
          data.sendType === 'master_list' ||
          data.sendType === 'driver_list'
        ) {
          setUserList(prev => {
            const newUser = {
              id: data.id,
              type: Number(data.type || 0),
              group_name: data.group_name || '',
              first_name: data.first_name || '',
              last_name: data.last_name || '',
              email: data.email || '',
              sender: data.sender_id || data.created_by || data.id,
              image_url: data.image_url,
              sent_time: data.sent_time || data.created_at
            }

            const filtered = prev.filter(
              item =>
                !(
                  Number(item.id) === Number(newUser.id) &&
                  Number(item.type) === Number(newUser.type)
                )
            )

            return [...filtered, newUser]
          })

          return
        }

        if (data.sendType === 'group_list') {
          const groupId = Number(data.id || data.group_id)

          if (!groupId) {
            return
          }

          setUserList(prev => {
            const exists = prev.some(
              item => Number(item.id) === groupId && Number(item.type) === 1
            )

            if (exists) {
              return prev
            }

            return [
              ...prev,
              {
                id: groupId,
                type: 1,
                group_name: data.group_name || '',
                first_name: '',
                last_name: '',
                email: '',
                sender: data.sender_id || data.created_by,
                image_url: data.image_url,
                sent_time: data.sent_time || data.created_at
              }
            ]
          })

          return
        }

        if (data.sendType === 'totalMsg') {
          const type = Number(data.type || 0)

          const conversationId =
            type === 1 ? Number(data.group_id) : Number(data.sender_id)

          if (!conversationId) {
            return
          }

          const selectedId = Number(idSelectRef.current)

          if (conversationId === selectedId) {
            return
          }

          setUserList(prev => {
            const index = prev.findIndex(
              item =>
                Number(item.id) === conversationId && Number(item.type) === type
            )

            if (index === -1) {
              return prev
            }

            const selectedUser = prev[index]

            return [
              selectedUser,
              ...prev.filter((_, itemIndex) => itemIndex !== index)
            ]
          })

          if (type === 1) {
            setUnRead(prev => {
              const key = `1_${conversationId}`

              return {
                ...prev,
                [key]: [
                  ...(prev[key] || []),
                  {
                    id: data.id,
                    type: 1,
                    content: data.content,
                    sender: data.sender_id,
                    sent_time: data.sent_time,
                    image_url: data.image_url,
                    receiverId: data.group_id,
                    sender_name: data.sender_name,
                    reciever_name: data.reciever_name,
                    dataMethod: 2
                  }
                ]
              }
            })

            return
          }

          setUnRead(prev => {
            const key = `0_${conversationId}`

            return {
              ...prev,
              [key]: [
                ...(prev[key] || []),
                {
                  id: data.id,
                  type: 0,
                  content: data.content,
                  image_url: data.image_url,
                  sent_time: data.sent_time,
                  sender_name: data.sender_name,
                  reciever_name: data.reciever_name,
                  sender: data.sender_id,
                  receiverId: data.receiver_id,
                  dataMethod: 2
                }
              ]
            }
          })

          return
        }

        if (data.sendType === 'new_message') {
          const type = Number(data.type || 0)

          const conversationId =
            type === 1 ? Number(data.group_id) : Number(data.sender_id)

          const selectedId = Number(idSelectRef.current)

          if (!conversationId) {
            return
          }

          if (Number(data.sender_id) === Number(id)) {
            return
          }

          if (conversationId === selectedId) {
            if (socket.readyState === WebSocket.OPEN) {
              socket.send(
                JSON.stringify({
                  sendType: 'update_read_status',
                  receiverId: conversationId,
                  isGroup: type === 1
                })
              )
            }

            return
          }

          const combinedKey = `${type}_${conversationId}`

          const senderName =
            type === 1
              ? data.sender_name || data.group_name || 'New Group Message'
              : data.sender_name || 'New Message'

          const notificationMessage = data.image_url
            ? '📷 Sent an image'
            : data.content || 'You have a new message'

          toast.info(
            <div
              onClick={() => {
                handleClick(
                  type,
                  conversationId,
                  data.sender_name || '',
                  data.group_name || ''
                )
              }}
              style={{
                cursor: 'pointer'
              }}
            >
              <strong>{senderName}</strong>

              <div className='text-muted mt-1'>{notificationMessage}</div>
            </div>
          )

          setUserList(prev => {
            const index = prev.findIndex(
              item =>
                Number(item.id) === conversationId && Number(item.type) === type
            )

            if (index === -1) {
              return prev
            }

            const selectedUser = prev[index]

            return [
              selectedUser,
              ...prev.filter((_, itemIndex) => itemIndex !== index)
            ]
          })

          setUnRead(prev => ({
            ...prev,
            [combinedKey]: [
              {
                id: data.id,
                content: data.content,
                image_url: data.image_url,
                sent_time: data.sent_time,
                type,
                sender_name: data.sender_name,
                reciever_name: data.reciever_name,
                sender: data.sender_id,
                receiverId: type === 1 ? data.group_id : data.receiver_id,
                dataMethod: 1
              },
              ...(prev[combinedKey] || [])
            ]
          }))

          return
        }

        if (data.sendType === 'message_read_status') {
          const type = Number(data.type || 0)

          const conversationId =
            type === 1 ? Number(data.group_id) : Number(data.sender_id)

          if (!conversationId) {
            return
          }

          const combinedKey = `${type}_${conversationId}`

          setUnRead(prev => {
            const next = {
              ...prev
            }

            delete next[combinedKey]

            return next
          })

          return
        }

        if (data.type === 'error') {
          console.error(
            'ChatList WebSocket server error:',
            data.sendType,
            data.message
          )

          return
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error)
      }
    }

    socket.onerror = error => {
      console.error('ChatList WebSocket error:', error)
    }

    socket.onclose = () => {
      if (socketRef.current === socket) {
        socketRef.current = null
      }
    }

    return () => {
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
  }, [id, masterId, token, webSocketUrl])

  useEffect(() => {
    const search = (searchValue || '').toLowerCase()

    const filtered = userList.filter(data => {
      if (data.type === 1) {
        return data.group_name?.toLowerCase().includes(search)
      }

      const fullName = `${data.first_name || ''} ${
        data.last_name || ''
      }`.toLowerCase()

      const email = (data.email || '').toLowerCase()

      return fullName.includes(search) || email.includes(search)
    })

    setFilteredUsers(filtered)
    setLoading(true)
  }, [searchValue, userList])

  const handleClick = (type, selectedId, name, group_name) => {
    const numericType = Number(type)
    const numericSelectedId = Number(selectedId)

    idSelectRef.current = numericSelectedId

    setIsGroup(numericType === 1)

    setData(numericType === 1 ? group_name : name)

    setSelectId(numericSelectedId)
    setSelectedChat(true)

    const combinedKey = `${numericType}_${numericSelectedId}`

    setUnRead(prev => {
      const newState = {
        ...prev
      }

      delete newState[combinedKey]

      return newState
    })

    const socket = socketRef.current

    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(
        JSON.stringify({
          sendType: 'update_read_status',
          isGroup: numericType === 1,
          receiverId: numericSelectedId
        })
      )
    }

    setUserList(prev => {
      const index = prev.findIndex(
        item =>
          Number(item.id) === numericSelectedId &&
          Number(item.type) === numericType
      )

      if (index === -1) {
        return prev
      }

      const selectedUser = prev[index]

      return [
        selectedUser,
        ...prev.filter((_, itemIndex) => itemIndex !== index)
      ]
    })
  }

  const conTime = (time, dataMethod) => {
    if (!time) {
      return ''
    }

    const date = new Date(time)

    if (Number.isNaN(date.getTime())) {
      return ''
    }

    if (Number(dataMethod) === 2) {
      return new Intl.DateTimeFormat('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }).format(date)
    }

    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'America/Denver',
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(date)
  }

  return (
    <div className='card-body pt-5' id='kt_chat_contacts_body'>
      <div
        className='overflow-auto me-n5 pe-5'
        style={{
          maxHeight: '200px'
        }}
      >
        {loading ? (
          filteredUsers.length > 0 ? (
            filteredUsers.map((data, index) => {
              const unreadKey = `${Number(data.type)}_${Number(data.id)}`

              const unreadMessages = unread[unreadKey] || []

              return (
                <div
                  key={`${data.type}-${data.id}-${index}`}
                  onClick={() =>
                    handleClick(
                      data.type,
                      data.id,
                      `${data.first_name || ''} ${data.last_name || ''}`.trim(),
                      data.group_name
                    )
                  }
                  className='d-flex justify-content-between align-items-center py-3 border-bottom'
                  style={{
                    cursor: 'pointer'
                  }}
                >
                  <div className='d-flex align-items-center'>
                    <div className='position-relative'>
                      <span
                        className='rounded-circle bg-light-danger text-danger fw-bold d-flex align-items-center justify-content-center'
                        style={{
                          width: '45px',
                          height: '45px',
                          overflow: 'hidden'
                        }}
                      >
                        <img
                          src={`${asset_url}/assets/img/${
                            Number(data.type) === 1
                              ? 'group_icon.png'
                              : 'profile.jpg'
                          }`}
                          alt='profile'
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            borderRadius: '50%'
                          }}
                        />
                      </span>

                      <span
                        className='position-absolute translate-middle badge rounded-circle bg-success'
                        style={{
                          width: '10px',
                          height: '10px',
                          bottom: 0,
                          right: 0
                        }}
                      />
                    </div>

                    <div className='ms-3'>
                      <div className='d-block fw-bold text-dark text-decoration-none'>
                        {Number(data.type) === 1
                          ? data.group_name
                          : `${data.first_name || ''} ${
                              data.last_name || ''
                            }`.trim()}
                      </div>

                      {unreadMessages.length > 0 && (
                        <div className='d-flex gap-2 align-items-center text-muted fw-bold small'>
                          {unreadMessages[0].image_url ? (
                            <>
                              <i className='ki-picture ki-outline ps-1 fs-5' />
                              <div>Photo</div>
                            </>
                          ) : (
                            unreadMessages[0].content
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className='text-end'>
                    <span className='text-muted small d-block'>
                      {unreadMessages.length > 0 &&
                        conTime(
                          unreadMessages[0].sent_time,
                          unreadMessages[0].dataMethod
                        )}
                    </span>

                    {unreadMessages.length > 0 && (
                      <span className='badge bg-success text-white rounded-circle'>
                        {unreadMessages.length}
                      </span>
                    )}
                  </div>
                </div>
              )
            })
          ) : (
            <div className='text-center py-3'>No users available</div>
          )
        ) : (
          [...Array(5)].map((_, index) => (
            <div
              key={index}
              className='d-flex justify-content-between align-items-center py-3 border-bottom'
            >
              <div className='d-flex align-items-center'>
                <div className='position-relative'>
                  <Skeleton circle width={45} height={45} />
                </div>

                <div className='ms-3'>
                  <Skeleton width={150} height={15} />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
