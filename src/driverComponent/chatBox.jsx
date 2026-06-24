'use client';

import axios from 'axios';

import debounce from 'lodash.debounce';

import { useSession } from 'next-auth/react';

import Skeleton from 'react-loading-skeleton';
import { useState, useEffect, useRef, useCallback } from 'react';

const ChatPage = () => {
    const [ids, SetId] = useState();
    const [rid, setRId] = useState();
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const socketRef = useRef(null);
    const [unRead, setUnRead] = useState([]);
    const [uploadStatus, setUploadStatus] = useState("");
    const chatContainerRef = useRef(null); // Ref for the chat container
    const [messages, setMessages] = useState([]);
    const [imagePreview, setImagePreview] = useState(null);

    const webSocketUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL;
    const url = process.env.NEXT_PUBLIC_BACKEND_API_URL;

    const { data: session } = useSession();

    const token = session && session.user && session?.user?.token;

    const fetchUserData = useCallback(
        debounce((token) => {
            axios
                .get(`${url}/user`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                })
                .then((response) => {
                    const id = response.data.id;
                    SetId(id);
                })
                .catch((error) => {
                    console.error("Error fetching user data:", error);
                });
        }, 500),
        [url]
    );

    useEffect(() => {
        if (token) {
            fetchUserData(token);
        }
    }, [token, fetchUserData]);

    useEffect(() => {
        if (ids == 98) {
            setRId(97);
        } else {
            setRId(98);
        }
    }, [ids]);

    useEffect(() => {
        socketRef.current = new WebSocket(webSocketUrl);

        socketRef.current.onopen = () => {
            if (ids && rid) {
                socketRef.current?.send(
                    JSON.stringify({
                        sendType: 'auth',
                        senderId: ids,
                        recieverId: rid,
                    })
                );
            }

        };

        socketRef.current.onmessage = (event) => {
            const data = JSON.parse(event.data);

            if (data.sendType === 'previous_message') {
                setMessages((prev) => [
                    ...prev,
                    { text: data.content, sender: data.sender_id, image_url: data.image_url, sent_time: data.sent_time },
                ]);
            } else if (data.sendType === 'new_message') {
                setMessages((prev) => [
                    ...prev,
                    { text: data.content, sender: 'bot', image_url: data.image_url, sent_time: new Date().toISOString() },
                ]);
            }
        };

        // socketRef.current.onclose = () => {
        // };

        socketRef.current.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        return () => {
            socketRef.current?.close();
        };
    }, [ids, rid]);

    useEffect(() => {
        // Scroll to the bottom of the chat container whenever messages change
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = (e) => {
        e.preventDefault();

        if ((message?.trim() ?? '') === '' && (imagePreview?.trim() ?? '') === '') {
            return;
        }


        if (!ids && !rid) {
            return null;
        }

        const messageData = {
            type: 0,
            sendType: 'message',
            sender_id: ids,
            reciever_id: rid,
            image_url: imagePreview,
            master_id: 95,
            master_company_id: 94,
            content: message,
        };

        socketRef.current?.send(JSON.stringify(messageData));

        setMessages((prev) => [
            ...prev,
            { text: message, sender: ids, image_url: imagePreview, sent_time: new Date().toISOString() },
        ]);

        setMessage('');
        setIsTyping(false);
        setImagePreview(null); // Clear image preview after sending
    };

    const handleImageSelect = async (e) => {
        const file = e.target.files[0]; // Get the first file selected

        if (file) {
            // Generate a preview URL for the image
            const imageUrl = URL.createObjectURL(file);

            // Create a FormData object and append the actual file
            const formData = new FormData();
            formData.append("file", file); // Append the file, NOT the URL

            try {
                // Send the POST request to upload the file
                const response = await fetch(`${url}/save/image/message`, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`, // Attach the token in the headers
                    },
                    body: formData, // Send the FormData object in the body
                });

                if (response.ok) {
                    const data = await response.json();
                    setImagePreview(data.file_path);
                } else {
                    console.error("File upload failed:", response.statusText);
                }
            } catch (error) {
                console.error("Error uploading file:", error);
                setUploadStatus("Failed: An error occurred.");
            }
        } else {
            console.error("No file selected");
        }
    };

    useEffect(() => {
        if (ids && rid) {
            setLoading(true);
        }
    }, [ids, rid]);

    const handleRemoveImagePreview = () => {
        setImagePreview(null); // Remove image preview
    };

    if (!loading) {
        return (
            <div style={{ maxWidth: '600px', margin: 'auto', padding: '1rem' }}>
                <h1 style={{ textAlign: 'center' }}>Chat</h1>
                <div
                    style={{
                        border: '1px solid #ccc',
                        borderRadius: '10px',
                        padding: '1rem',
                        height: '400px',
                        overflowY: 'scroll',
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                >
                    <Skeleton />
                </div>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '600px', margin: 'auto', padding: '1rem' }}>
            <h1 style={{ textAlign: 'center' }}>Chat</h1>
            <div
                ref={chatContainerRef}
                style={{
                    border: '1px solid #ccc',
                    borderRadius: '10px',
                    padding: '1rem',
                    height: '400px',
                    overflowY: 'scroll',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                {messages.map((msg, index) => {
                    const currentDate = new Date(msg.sent_time).toDateString();
                    const previousDate = index > 0 ? new Date(messages[index - 1].sent_time).toDateString() : null;

                    // Determine if a date label should be displayed
                    const showDateLabel = currentDate !== previousDate;

                    // Helper function to format the date
                    const formatDate = (dateString) => {
                        const date = new Date(dateString);
                        const today = new Date();
                        const yesterday = new Date();
                        yesterday.setDate(today.getDate() - 1);

                        if (date.toDateString() === today.toDateString()) return 'Today';
                        if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';

                        // Format as "dd Month" (e.g., "10 December")
                        return date.toLocaleDateString(undefined, { day: '2-digit', month: 'long' });
                    };

                    return (
                        <div key={index}>
                            {/* Date label */}
                            {showDateLabel && (
                                <div
                                    style={{
                                        textAlign: 'center',
                                        color: '#888',
                                        fontSize: '0.9rem',
                                        margin: '10px 0',
                                    }}
                                >
                                    {formatDate(msg.sent_time)}
                                </div>
                            )}

                            {/* Message content */}
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: msg.sender === ids ? 'flex-end' : 'flex-start',
                                    marginBottom: '10px',
                                }}
                            >
                                <div
                                    style={{
                                        backgroundColor: msg.sender === ids ? '#DCF8C6' : '#E8E8E8',
                                        color: '#000',
                                        padding: '10px',
                                        borderRadius: '10px',
                                        maxWidth: '70%', // Fixed width for chat bubble
                                        wordWrap: 'break-word',
                                    }}
                                >
                                    {msg.image_url && (
                                        <div style={{ marginTop: '10px', marginBottom: '10px' }}>
                                            <img
                                                src={msg.image_url}
                                                alt="Sent Image"
                                                style={{
                                                    maxWidth: '100%',
                                                    maxHeight: '150px',
                                                    borderRadius: '10px',
                                                    objectFit: 'contain',
                                                }}
                                            />
                                        </div>
                                    )}
                                    <div style={{ marginTop: '10px' }}>{msg.text}</div>
                                    <div
                                        style={{
                                            fontSize: '0.8rem',
                                            color: '#888',
                                            textAlign: 'right',
                                            marginTop: '10px',
                                        }}
                                    >
                                        {new Date(msg.sent_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
                {imagePreview && (
                    <div style={{ alignSelf: 'flex-end', marginTop: '10px', position: 'relative' }}>
                        <div style={{ backgroundColor: '#DCF8C6', padding: '10px', borderRadius: '10px' }}>
                            <img
                                src={imagePreview}
                                alt="Preview"
                                style={{
                                    maxWidth: '100%',
                                    maxHeight: '150px',
                                    borderRadius: '10px',
                                    objectFit: 'contain',
                                }}
                            />
                            {/* Cross button to remove image */}
                            <button
                                onClick={handleRemoveImagePreview}
                                style={{
                                    position: 'absolute',
                                    top: '5px',
                                    right: '5px',
                                    backgroundColor: 'transparent',
                                    border: 'none',
                                    color: '#000',
                                    fontSize: '20px',
                                    cursor: 'pointer',
                                }}
                            >
                                &times;
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Image preview */}

            <form onSubmit={handleSendMessage} style={{ display: 'flex', alignItems: 'center', marginTop: '1rem' }}>
                <input
                    type="text"
                    placeholder="Type your message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={() => setIsTyping(true)}
                    onBlur={() => setIsTyping(false)}
                    style={{
                        flex: 1,
                        padding: '10px',
                        border: '1px solid #ccc',
                        borderRadius: '20px',
                        outline: 'none',
                        marginRight: '10px',
                        color: '#000',
                    }}
                />

                {/* Image upload button */}
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    style={{ display: "none" }}
                    id="image-upload"
                />
                <label htmlFor="image-upload">
                    <img
                        src="/logo/img-url.png"
                        alt="Send Image"
                        style={{
                            width: "30px",
                            height: "30px",
                            cursor: "pointer",
                            marginRight: "10px",
                        }}
                    />
                </label>

                <button
                    type="submit"
                    style={{
                        backgroundColor: '#007BFF',
                        color: '#fff',
                        border: 'none',
                        padding: '10px 20px',
                        borderRadius: '10px',
                        cursor: 'pointer',
                    }}
                >
                    Send
                </button>
            </form>
        </div>

    );
};

export default ChatPage;
