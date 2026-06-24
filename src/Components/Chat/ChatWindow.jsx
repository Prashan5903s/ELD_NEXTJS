'use client'

import moment from 'moment-timezone';
import { useSession } from "next-auth/react";
// import 'bootstrap/dist/css/bootstrap.min.css';
import Skeleton from 'react-loading-skeleton';
import { useState, useEffect, useRef } from "react";

export default function ChatWindow({ id, data, isGroup, selectId, selectedChat }) {

    const socketRef = useRef(null);

    const [message, setMessage] = useState(""); // Keep the single message value here

    const [messages, setMessages] = useState([]); // Initialize with an empty array

    const [imagePreview, setImagePreview] = useState(null);

    const { data: session } = useSession();

    const [loading, setLoading] = useState(false);

    const token = session && session.user && session?.user?.token;

    const [uploadStatus, setUploadStatus] = useState("");

    const webSocketUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL;

    const url = process.env.NEXT_PUBLIC_BACKEND_API_URL;

    const getSaltLakeCityTime = () => {
        // Get the current time in Salt Lake City timezone
        const now = moment().tz('America/Denver');
        // Format the time
        const formatted = now.format('YYYY-MM-DD HH:mm:ss Z');
        return formatted;
    };

    useEffect(() => {

        socketRef.current = new WebSocket(webSocketUrl);

        socketRef.current.onopen = () => {
            
            if (id && selectId && selectedChat) {

                socketRef.current?.send(
                    JSON.stringify({
                        sendType: 'auth',
                        isGroup: isGroup,
                        senderId: id,
                        recieverId: selectId,
                    })
                );

                socketRef.current?.send(
                    JSON.stringify({
                        sendType: 'update_read_status',
                        isGroup: isGroup,
                        senderId: selectId,
                        recieverId: id,
                        useType: 1 == 1,
                    })
                );

            }

        };

        // Clear message input when WebSocket is opened or when there's a message received
        setMessages("");

        socketRef.current.onmessage = (event) => {

            const data = JSON.parse(event.data);

            if (data.sendType === 'previous_message') {
                setMessages((prev) => [
                    ...prev,
                    { text: data.content, sender: data.sender_id, sender_name: data.sender_name, reciever_name: data.reciever_name, image_url: data.image_url, sent_time: data.sent_time, DataMethod: 1 },
                ]);
            } else if (data.sendType === 'new_message') {

                if (data.type != 1) {

                    if (data.sender_id == selectId && data.reciever_id == id) {

                        setMessages((prev) => [
                            ...prev,
                            { text: data.content, sender: data.sender_id, sender_name: data.sender_name, reciever_name: data.reciever_name, image_url: data.image_url, sent_time: data.sent_time, DataMethod: 2 },
                        ]);

                    }

                } else {

                    if (data.reciever_id == selectId) {

                        setMessages((prev) => [
                            ...prev,
                            { text: data.content, sender: data.sender_id, sender_name: data.sender_name, reciever_name: data.reciever_name, image_url: data.image_url, sent_time: data.sent_time, DataMethod: 2 },
                        ]);

                    }

                }

            }

        };

        socketRef.current.onclose = () => {
        };

        socketRef.current.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        return () => {
            socketRef.current?.close();
        };
    }, [id, selectId, selectedChat]);

    const handleSendMessage = (e) => {

        e.preventDefault();

        if (message.trim() === '' && imagePreview.trim() == '') {
            return; // Do nothing if the message is empty
        }

        if (id == undefined && selectId == undefined) {
            return null;
        }

        const messageData = {
            master_id: 95,
            sender_id: id,
            content: message,
            sendType: 'message',
            type: isGroup ? 1 : 0,
            reciever_id: selectId,
            master_company_id: 94,
            image_url: imagePreview,
            sent_time: getSaltLakeCityTime(),
        };

        socketRef.current?.send(JSON.stringify(messageData));

        if (!isGroup) {

            setMessages((prev) => [
                ...prev,
                { text: message, sender: id, sender_name: null, reciever_name: null, image_url: imagePreview, sent_time: getSaltLakeCityTime(), DataMethod: 2 },
            ]);

        }

        // Clear the message input and image preview after sending
        setMessage('');
        setImagePreview(null);

    };

    const saveFile = async (file) => {
        const formData = new FormData();
        formData.append("file", file);

        try {
            const response = await fetch(`${url}/save/image/message`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            if (response.ok) {
                const data = await response.json();
                setImagePreview(data.file_path);
            } else {
                console.error("File upload failed:", response.statusText);
                setUploadStatus("Failed: File upload failed.");
            }
        } catch (error) {
            console.error("Error uploading file:", error);
            setUploadStatus("Failed: An error occurred.");
        }
    };

    const handleImageSelect = (e) => {
        setImagePreview(null);
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
            saveFile(file);
        }
    };

    useEffect(() => {
        if (messages) {
            setLoading(true);
        }
    }, [messages])

    return (

        <div className="flex-lg-row-fluid ms-lg-7 ms-xl-10">
            {selectedChat ? (
                <div className="card" id="kt_chat_messenger">
                    <div className="card-header" id="kt_chat_messenger_header">
                        <div className="card-title">
                            <div className="d-flex justify-content-center flex-column me-3">
                                <aside></aside>{data ? data : ""}
                            </div>
                        </div>

                        <div className="card-toolbar">
                            <div className="me-n3">
                                <button
                                    className="btn btn-sm btn-icon btn-active-light-primary"
                                    data-kt-menu-trigger="click"
                                    data-kt-menu-placement="bottom-end"
                                >
                                    <i className="ki-outline ki-dots-square fs-2"></i>
                                </button>
                                <div
                                    className="menu menu-sub menu-sub-dropdown menu-column menu-rounded menu-gray-800 menu-state-bg-light-primary fw-semibold w-200px py-3"
                                    data-kt-menu="true"
                                >
                                    {/* Menu items */}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card-body" id="kt_chat_messenger_body">
                        <div
                            className="scroll-y me-n5 pe-5 h-300px h-lg-auto"
                            data-kt-element="messages"
                            data-kt-scroll="true"
                            data-kt-scroll-activate="{default: false, lg: true}"
                            data-kt-scroll-max-height="auto"
                            data-kt-scroll-dependencies="#kt_header, #kt_app_header, #kt_app_toolbar, #kt_toolbar, #kt_footer, #kt_app_footer, #kt_chat_messenger_header, #kt_chat_messenger_footer"
                            data-kt-scroll-wrappers="#kt_content, #kt_app_content, #kt_chat_messenger_body"
                            data-kt-scroll-offset="5px"
                        >
                            {

                                loading
                                    ?
                                    (


                                        messages.length > 0 &&
                                        messages.map((data, index) => {

                                            var formattedTime = null;

                                            if (data.DataMethod == 2) {

                                                formattedTime = new Intl.DateTimeFormat('en-US', {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                    hour12: true,
                                                    timeZone: 'America/Denver', // Set timezone to Salt Lake City
                                                }).format(new Date(data.sent_time));

                                            } else {

                                                formattedTime = new Date(data.sent_time).toLocaleTimeString('en-US', {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                    hour12: true,
                                                });

                                            }


                                            return (
                                                <div key={index}>
                                                    <div className={`d-flex ${data.sender == id ? 'justify-content-end' : 'justify-content-start'} mb-10`}>
                                                        <div className="d-flex flex-column align-items-start">
                                                            <div className="d-flex align-items-center mb-2">
                                                                {/* <div className="symbol symbol-35px symbol-circle">
                                                        <img alt="Pic" src="/assets/media/avatars/300-25.jpg" />
                                                    </div> */}
                                                                <div className="ms-3">
                                                                    <a href="#" style={{ textDecoration: 'none' }} className="fs-5 fw-bold text-gray-900 text-hover-primary me-1">
                                                                        {data.sender == id ? "You" : (isGroup ? data.sender_name : (data.reciever_name ? data.reciever_name : data.sender_name))}
                                                                    </a>
                                                                    <span className="text-muted fs-7 mb-1">{formattedTime}</span>
                                                                </div>
                                                            </div>
                                                            <div
                                                                className={`p-5 rounded ${data.sender === id ? "bg-light-primary" : "bg-light-info"} text-gray-900 fw-semibold mw-lg-400px text-start`}
                                                                data-kt-element="message-text"
                                                            >
                                                                {data.image_url && (
                                                                    <img
                                                                        src={data.image_url}
                                                                        alt="Sent"
                                                                        style={{
                                                                            maxWidth: '100%',
                                                                            maxHeight: '200px',
                                                                            borderRadius: '8px',
                                                                            marginTop: '5px',
                                                                        }}
                                                                    />
                                                                )}
                                                                {data.text}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )
                                    :
                                    (
                                        [...Array(5)].map((_, index) => (
                                            <div key={index}>
                                                <div className={`d-flex ${((index + 1) % 2 == 0) ? 'justify-content-end' : 'justify-content-start'} mb-10`}>
                                                    <div className="d-flex flex-column align-items-start">
                                                        <div className="d-flex align-items-center mb-2">
                                                            {/* <div className="symbol symbol-35px symbol-circle">
                                                        <img alt="Pic" src="/assets/media/avatars/300-25.jpg" />
                                                    </div> */}
                                                            <div className="ms-3">
                                                                <a href="#" style={{ textDecoration: 'none' }} className="fs-5 fw-bold text-gray-900 text-hover-primary me-1">
                                                                    <Skeleton width={400} height={50} />
                                                                </a>
                                                                {/* <span className="text-muted fs-7 mb-1">{formattedTime}</span> */}
                                                            </div>
                                                        </div>
                                                        <div
                                                            className={`p-5 rounded text-gray-900 fw-semibold mw-lg-400px text-start`}
                                                            data-kt-element="message-text"
                                                        >
                                                            <Skeleton width={400} height={30} />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )
                            }
                            {imagePreview && (
                                <div className="d-flex justify-content-end mb-3">
                                    <div
                                        className="image-preview p-3 rounded bg-light-primary position-relative"
                                        style={{
                                            maxWidth: '70%',
                                            borderRadius: '8px',
                                        }}
                                    >
                                        <img
                                            src={imagePreview}
                                            alt="Preview"
                                            className="img-fluid rounded"
                                            style={{
                                                maxWidth: '100%',
                                                maxHeight: '200px',
                                            }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setImagePreview(null)}
                                            className="btn btn-sm btn-icon position-absolute top-0 end-0 mt-1 me-1"
                                            style={{
                                                background: 'transparent',
                                                border: 'none',
                                                color: '#000',
                                                fontWeight: 'bold',
                                            }}
                                        >
                                            <i
                                                className="ki-outline ki-cross fs-5"
                                                style={{
                                                    color: 'rgba(0, 0, 0, 0.8)', // Darker black
                                                    fontSize: '1.25rem', // Slightly larger for better visibility
                                                }}
                                            ></i>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>


                    <div className="card-footer pt-4" id="kt_drawer_chat_messenger_footer">
                        <form
                            onSubmit={handleSendMessage}
                            className="d-flex align-items-center mt-3"
                            style={{ gap: '10px' }}
                        >
                            <textarea
                                className="form-control me-2"
                                rows="1"
                                onChange={(e) => setMessage(e.target.value)}
                                value={message}
                                placeholder="Type a message..."
                            />

                            <div className="d-flex align-items-center">
                                <div className="btn-group me-2">
                                    <label
                                        htmlFor="imageInput"
                                        className="btn btn-secondary btn-sm"
                                        data-bs-toggle="tooltip"
                                        title="Select Image"
                                    >
                                        <i className="ki-outline ki-paper-clip fs-5"></i>
                                    </label>
                                    <input
                                        id="imageInput"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageSelect}
                                        className="d-none"
                                    />
                                </div>
                                <button className="btn btn-primary btn-sm" type="submit">
                                    Send
                                </button>
                            </div>
                        </form>

                    </div>
                </div>
            )
                : (
                    <div className="d-flex align-item-center justify-content-center">
                        <div>
                            <img src="/logo/chat.png" alt="" />
                        </div>
                    </div>

                )
            }
        </div >
    );
}