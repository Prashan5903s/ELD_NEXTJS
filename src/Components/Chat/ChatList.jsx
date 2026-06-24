'use client';

import { format } from 'date-fns';
import Skeleton from 'react-loading-skeleton';
import { utcToZonedTime } from 'date-fns-tz';
// import 'bootstrap/dist/css/bootstrap.min.css';
import { useState, useEffect, useRef } from 'react';

export default function ChatList({ id, masterId, setIsGroup, setSelectId, setSelectedChat, setData, searchValue }) {

    const idSelectRef = useRef(); // Use ref for idSelect
    const socketRef = useRef(null);
    const [loading, setLoading] = useState(false);
    const [unread, setUnRead] = useState({}); // Initialize as an object
    const [userList, setUserList] = useState([]);
    const asset_url = process.env.NEXT_PUBLIC_ASSERT_URL;
    const webSocketUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL;
    const [filteredUsers, setFilteredUsers] = useState(userList);

    useEffect(() => {
        if (!id || !masterId) return;


        // Check if WebSocket is already initialized
        if (!socketRef.current) {
            // Debugging WebSocket URL

            // Initialize the WebSocket connection
            socketRef.current = new WebSocket(webSocketUrl);

            socketRef.current.onopen = () => {


                // Send initial data once WebSocket is open
                socketRef.current.send(
                    JSON.stringify({
                        sendType: 'userInfo',
                        senderId: id,
                        masterId: masterId,
                    })
                );

                // Send totalMsg request
                socketRef.current.send(
                    JSON.stringify({
                        sendType: 'totalMsg',
                        senderId: id,
                        receiverId: id,
                    })
                );
            };

            socketRef.current.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    // Your existing data handling logic
                    if (
                        data.sendType === 'user_list' ||
                        data.sendType === 'master_list' ||
                        data.sendType === 'driver_list' ||
                        data.sendType === 'user_group_list'
                    ) {

                        setUserList((prev) => [
                            {
                                id: data.id,
                                type: data.type,
                                group_name: data.group_name,
                                first_name: data.first_name,
                                last_name: data.last_name,
                                email: data.email,
                                sender: data.sender_id || data.created_by,
                                image_url: data.image_url,
                                sent_time: data.sent_time || data.created_at,
                            },
                            ...prev,
                        ]);
                    }
                    else if (
                        data.sendType === 'group_list'
                    ) {

                        var userId = Array.isArray(data.user_id) ? data.user_id : [String(data.user_id)];

                        var createdBy = data.created_by;

                        if (userId.includes(String(id)) || createdBy == id) {
                            setUserList((prev) => [
                                {
                                    id: data.id ? data.id : data.group_id,
                                    type: data.type,
                                    group_name: data.group_name,
                                    first_name: data.first_name,
                                    last_name: data.last_name,
                                    email: data.email,
                                    sender: data.sender_id || data.created_by,
                                    image_url: data.image_url,
                                    sent_time: data.sent_time || data.created_at,
                                },
                                ...prev, // Add the existing items after the new item
                            ]);
                        }


                    } else if (data.sendType === 'totalMsg') {

                        // Update unread messages immutably
                        const key1 = data.type ? data.reciever_id : data.sender_id;
                        const key2 = data.type;
                        const key3 = data.receiver_id != 0 ? data.receiver_id : data.group_id;
                        const key4 = data.is_read.split(",").map(Number); // Converts "98,99" into [98, 99]

                        const values = idSelectRef.current;

                        const exists = key4.includes(id);

                        if (data.type) {

                            const combinedKey = `${key2}_${key3}`;

                            if (data.sender_id != id && !exists) {

                                if (key3 != values) {

                                    setUnRead((prev) => ({
                                        ...prev,
                                        [combinedKey]: [
                                            ...(prev[combinedKey] || []),
                                            {
                                                type: data.type,
                                                content: data.content,
                                                sender: data.sender_id,
                                                sent_time: data.sent_time,
                                                image_url: data.image_url,
                                                receiverId: data.receiver_id,
                                                sender_name: data.sender_name,
                                                reciever_name: data.reciever_name,
                                                dataMethod: 2,
                                            },
                                        ],
                                    }));

                                }

                            }

                        } else {

                            const combinedKey = `${key2}_${key1}`;

                            setUnRead((prev) => ({
                                ...prev,
                                [combinedKey]: [
                                    ...(prev[combinedKey] || []),
                                    {
                                        content: data.content,
                                        image_url: data.image_url,
                                        sent_time: data.sent_time,
                                        sender_name: data.sender_name,
                                        reciever_name: data.reciever_name,
                                        type: data.type,
                                        sender: data.sender_id,
                                        receiverId: data.receiver_id,
                                        dataMethod: 2,
                                    },
                                ],
                            }));
                        }
                    } else if (data.sendType === 'new_message') {

                        const idSelect = idSelectRef.current;

                        const key1 = data.type ? data.reciever_id : data.sender_id;

                        const key2 = data.type;

                        var key3 = data.reciever_id ? data?.reciever_id : data?.sender_id;

                        const combinedKey = `${key2}_${key1}`;

                        const values = idSelectRef.current;;

                        if (data.type) {

                            if (data.sender_id != id) {

                                if (data.reciever_id != values) {

                                    setUnRead((prev) => ({
                                        ...prev,
                                        [combinedKey]: [
                                            {
                                                content: data.content,
                                                image_url: data.image_url,
                                                sent_time: data.sent_time,
                                                type: data.type,
                                                sender_name: data.sender_name,
                                                reciever_name: data.reciever_name,
                                                sender: data.sender_id,
                                                receiverId: data.receiver_id,
                                                dataMethod: 1,
                                            },
                                            ...(prev[combinedKey] || []),
                                        ],
                                    }));

                                } else {

                                    socketRef.current?.send(
                                        JSON.stringify({
                                            sendType: 'update_read_status',
                                            isGroup: data.type == 1, // Adjust based on how you define group messages
                                            senderId: data.reciever_id,
                                            recieverId: data.sender_id,
                                            id: id,
                                            useType: 1 == 0,
                                        })
                                    );

                                }

                            }

                        } else {


                            if (data.reciever_id == id) {

                                if (key1 != idSelect) {

                                    setUnRead((prev) => ({
                                        ...prev,
                                        [combinedKey]: [
                                            {
                                                content: data.content,
                                                image_url: data.image_url,
                                                sent_time: data.sent_time,
                                                sender_name: data.sender_name,
                                                reciever_name: data.reciever_name,
                                                type: data.type,
                                                sender: data.sender_id,
                                                receiverId: data.receiver_id,
                                                dataMethod: 1,
                                            },
                                            ...(prev[combinedKey] || []),
                                        ],
                                    }));

                                } else {

                                    socketRef.current?.send(
                                        JSON.stringify({
                                            sendType: 'update_read_status',
                                            isGroup: data.type == 1, // Adjust based on how you define group messages
                                            senderId: data.sender_id,
                                            recieverId: data.reciever_id,
                                        })
                                    );

                                }


                            }

                        }

                    } else if (data.sendType == "message_read_status") {

                        var senderId = data.sender_id;

                        const key1 = data.type ? data.reciever_id : data.sender_id;

                        const key2 = data.type;

                        var key3 = data.reciever_id ? data?.reciever_id : data?.sender_id;

                        if (data.type) {

                            const combinedKey = `${key2}_${senderId}`;

                            if (key3 == id) {

                                setUnRead((prev) => {
                                    const newState = { ...prev }; // Create a shallow copy of the current state
                                    if (newState[combinedKey]) {
                                        delete newState[combinedKey]; // Remove the key-value pair if senderId matches the key
                                    }
                                    return newState;
                                });
                            }

                        } else {

                            const combinedKey = `${key2}_${key1}`;

                            setUnRead((prev) => {
                                const newState = { ...prev }; // Create a shallow copy of the current state
                                if (newState[combinedKey]) {
                                    delete newState[combinedKey]; // Remove the key-value pair if senderId matches the key
                                }
                                return newState;
                            });

                        }

                    }
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                }
            };

            socketRef.current.onerror = (error) => {
                console.error("WebSocket error:", error);
            };

            socketRef.current.onclose = () => {
            };
        }

        // Cleanup function to close the WebSocket on component unmount or id/masterId change
        return () => {
            if (socketRef.current) {
                socketRef.current.close();
            }
        };
    }, [id, masterId]); // Make sure both `id` and `masterId` are available

    useEffect(() => {
        const lowercasedSearch = searchValue.toLowerCase();
        const filtered = userList.filter((data) => {
            if (data.group_name) {
                // Search on group_name if it exists
                return data.group_name.toLowerCase().includes(lowercasedSearch);
            } else {
                // Search on first_name + last_name
                const fullName = `${data.first_name} ${data.last_name}`.toLowerCase();
                return fullName.includes(lowercasedSearch);
            }
        });
        setFilteredUsers(filtered);
    }, [searchValue, userList]);

    useEffect(() => {

        if (userList && filteredUsers) {

            if (userList.length > 0) {

                if (filteredUsers.length > 0) {

                    setLoading(true);

                } else {

                    setLoading(false);

                }
            }

            setLoading(true);

        }

    }, [userList, filteredUsers]);

    const handleClick = (type, id, name, group_name) => {
        setIsGroup(type === 1);
        setData(type === 1 ? group_name : name);
        setSelectId(id);
        idSelectRef.current = id;
        setSelectedChat(true); // Set isSelected to true when clicked
    };

    const formatDate = (dateString, type) => {

        const date = new Date(dateString);

        // Subtract 30 seconds to show half a minute less
        date.setSeconds(date.getMinutes() - 30);

        const options = {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        };

        // Format the date and time
        let formattedDate = new Intl.DateTimeFormat('en-US', options).format(date).replace(',', '');

        // Manually ensure the time is properly reduced (e.g., minute rounding issue)
        if (date.getMinutes() === 30) {
            const minutes = date.getMinutes() - 1;  // Decrease the minute
            date.setMinutes(minutes);
            formattedDate = new Intl.DateTimeFormat('en-US', options).format(date).replace(',', '');
        }

        return formattedDate;
    }


    function conTime(time, dataMethod) {


        if (dataMethod == 2) {
            const date = new Date(time);

            // Format the time
            const hours = date.getHours();
            const minutes = date.getMinutes();
            const ampm = hours >= 12 ? 'PM' : 'AM';
            const formattedHours = hours % 12 || 12; // Convert to 12-hour format
            const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;

            // Format the date
            const day = date.getDate();
            const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            const month = monthNames[date.getMonth()]; // Get the abbreviated month name
            const year = date.getFullYear();

            // Combine the parts into the desired format
            const formattedTime = `${month} ${day < 10 ? `0${day}` : day}, ${year}, ${formattedHours}:${formattedMinutes} ${ampm}`;

            return formattedTime;


        } else {

            var formattedTime = new Intl.DateTimeFormat('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
                timeZone: 'America/Denver', // Set timezone to Salt Lake City
                day: '2-digit',
                month: 'short',
                year: 'numeric',
            }).format(new Date(time));

            return formattedTime;

        }

    }

    return (
        <div className="card-body pt-5" id="kt_chat_contacts_body">
            <div
                className="overflow-auto me-n5 pe-5"
                style={{ maxHeight: '200px' }}
            >
                {
                    loading ?
                        (
                            filteredUsers.length > 0 ?
                                filteredUsers.map((data, index) => (
                                    <div
                                        key={index}
                                        onClick={() => handleClick(data.type, data.id, `${data.first_name} ${data.last_name}`, data.group_name)}
                                        className="d-flex justify-content-between align-items-center py-3 border-bottom"
                                    >
                                        <div className="d-flex align-items-center">
                                            <div className="position-relative">
                                                <span
                                                    className="rounded-circle bg-light-danger text-danger fw-bold d-flex align-items-center justify-content-center"
                                                    style={{ width: '45px', height: '45px', overflow: 'hidden' }}
                                                >
                                                    <img
                                                        src={`${asset_url}/assets/img/${data.type === 1 ? "group_icon.png" : "profile.jpg"}`}
                                                        alt="logo_icon"
                                                        style={{
                                                            width: '100%',
                                                            height: '100%',
                                                            objectFit: 'cover',
                                                            borderRadius: '50%',
                                                        }}
                                                    />
                                                </span>
                                                <span
                                                    className="position-absolute translate-middle badge rounded-circle bg-success"
                                                    style={{ width: '10px', height: '10px', bottom: 0, right: 0 }}
                                                ></span>
                                            </div>
                                            <div className="ms-3">
                                                <a
                                                    href="#"
                                                    className="d-block fw-bold text-dark text-decoration-none"
                                                >
                                                    {data.type === 1
                                                        ? data.group_name
                                                        : `${data.first_name} ${data.last_name}`}
                                                </a>
                                                {unread[`${data.type}_${data.id}`]?.length > 0 && (
                                                    <div
                                                        className={`d-flex gap-2 align-items-center text-muted ${unread[`${data.type}_${data.id}`]?.length > 0 && 'fw-bold'
                                                            } small`}
                                                    >
                                                        {(unread[`${data.type}_${data.id}`][0].image_url != null) ? (
                                                            <>
                                                                <i className="ki-picture ki-outline ps-1 fs-5"></i>
                                                                <div>Photo</div>
                                                            </>
                                                        ) : (
                                                            unread[`${data.type}_${data.id}`][0].content
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-end">
                                            <span className="text-muted small d-block">
                                                {
                                                    unread[`${data.type}_${data.id}`]?.length > 0 &&
                                                    conTime(unread[`${data.type}_${data.id}`][0].sent_time, unread[`${data.type}_${data.id}`][0].dataMethod)
                                                }
                                            </span>
                                            <span
                                                className={`badge ${unread[`${data.type}_${data.id}`]?.length > 0 ? 'bg-success' : ''
                                                    } text-dark rounded-circle`}
                                            >
                                                <span style={{ color: 'white' }}>
                                                    {unread[`${data.type}_${data.id}`]?.length > 0 && unread[`${data.type}_${data.id}`]?.length}
                                                </span>
                                            </span>
                                        </div>
                                    </div>
                                ))
                                : (
                                    <div className="text-center py-3">No users available</div>
                                )
                        )
                        :
                        (
                            ([...Array(5)].map((_, index) => (
                                <div
                                    key={index}
                                    className="d-flex justify-content-between align-items-center py-3 border-bottom"
                                >
                                    <div className="d-flex align-items-center">
                                        <div className="position-relative">
                                            <span
                                                className="rounded-circle bg-light-danger text-danger fw-bold d-flex align-items-center justify-content-center"
                                                style={{ width: '45px', height: '45px', overflow: 'hidden' }}
                                            >
                                                <Skeleton width={45} height={45} />
                                            </span>
                                            <span
                                                className="position-absolute translate-middle badge rounded-circle"
                                                style={{ width: '10px', height: '10px', bottom: 0, right: 0 }}
                                            >
                                                <Skeleton width={10} height={10} />
                                            </span>
                                        </div>
                                        <div className="ms-3">
                                            <a
                                                href="#"
                                                className="d-block fw-bold text-dark text-decoration-none"
                                            >
                                                <Skeleton width={150} height={15} />
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            )))
                        )
                }
            </div>
        </div>
    );
}
