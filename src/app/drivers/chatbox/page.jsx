'use client'

import axios from 'axios';
import debounce from 'lodash.debounce';
import { useSession } from 'next-auth/react';
// import 'bootstrap/dist/css/bootstrap.min.css';
// import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import { useState, useCallback, useEffect, useRef } from 'react';
import ChatList from '../../../Components/Chat/ChatList';
import ChatWindow from '../../../Components/Chat/ChatWindow';

export default function Home() {

    const socketRef = useRef(null);
    const [data, setData] = useState();
    const [ids, setId] = useState(null);
    const [isGroup, setIsGroup] = useState();
    const [errors, setErrors] = useState({});
    const [masterId, setMasterId] = useState();
    const [userData, setUserData] = useState();
    const [selectId, setSelectId] = useState(null);
    const { data: session } = (useSession()) || {};
    const [groupName, setGroupName] = useState('');
    const [searchValue, setSearchValue] = useState("");
    const url = process.env.NEXT_PUBLIC_BACKEND_API_URL;
    const [modalVisible, setModalVisible] = useState(false); // State to control modal visibility
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [selectedChat, setSelectedChat] = useState(false);
    const webSocketUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL;
    const [masterCompanyId, setMasterCompanyId] = useState();
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
                    const master_id = response.data.master_id;
                    const master_company_id = response.data.master_company_id;
                    setId(id);
                    setMasterId(master_id);
                    setMasterCompanyId(master_company_id);
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
        const id = ids;

        if (!id && !masterId) return; // Exit early if `id` is not defined

        // Initialize WebSocket connection
        socketRef.current = new WebSocket(webSocketUrl);

        socketRef.current.onopen = () => {


            socketRef.current.send(
                JSON.stringify({
                    sendType: "userInfo",
                    senderId: id,
                    masterId: masterId,
                })
            );
        };

        socketRef.current.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                if (data.sendType === "user_list") {
                    setUserData((prev = []) => [
                        ...prev,
                        {
                            id: data.id,
                            type: data.type,
                            group_name: data.group_name,
                            first_name: data.first_name,
                            last_name: data.last_name,
                            email: data.email,
                            sender: data.sender_id ? data.sender_id : data.created_by,
                            image_url: data.image_url,
                            sent_time: data.sent_time ? data.sent_time : data.created_at,
                        },
                    ]);
                } else if (data.sendType === "master_list") {
                    setUserData((prev = []) => [
                        ...prev,
                        {
                            id: data.id,
                            type: data.type,
                            group_name: data.group_name,
                            first_name: data.first_name,
                            last_name: data.last_name,
                            email: data.email,
                            sender: data.sender_id ? data.sender_id : data.created_by,
                            image_url: data.image_url,
                            sent_time: data.sent_time ? data.sent_time : data.created_at,
                        },
                    ]);
                } else if (data.sendType === "driver_list") {
                    setUserData((prev = []) => [
                        ...prev,
                        {
                            id: data.id,
                            type: data.type,
                            group_name: data.group_name,
                            first_name: data.first_name,
                            last_name: data.last_name,
                            email: data.email,
                            sender: data.sender_id ? data.sender_id : data.created_by,
                            image_url: data.image_url,
                            sent_time: data.sent_time ? data.sent_time : data.created_at,
                        },
                    ]);
                }
            } catch (error) {
                console.error("Error parsing WebSocket message:", error);
            }
        };

        socketRef.current.onclose = () => {

        };

        socketRef.current.onerror = (error) => {
            console.error("WebSocket error:", error);
        };

        // Clean up WebSocket connection on component unmount
        return () => {
            socketRef.current?.close();
        };
    }, [ids, masterId]);

    const handleGroupNameChange = (e) => {
        setGroupName(e.target.value);
    };

    const handleUserSelection = (e) => {
        const userId = e.target.value;
        if (e.target.checked) {
            setSelectedUsers([...selectedUsers, userId]);  // Add user ID to the array
        } else {
            setSelectedUsers(selectedUsers.filter(id => id !== userId)); // Remove user ID from the array
        }
    };

    const validateForm = () => {
        let formErrors = {};
        if (!groupName) {
            formErrors.groupName = "Group Name is required.";
        }
        if (selectedUsers.length === 0) {
            formErrors.selectedUsers = "At least one user must be selected.";
        }
        setErrors(formErrors);
        return Object.keys(formErrors).length === 0;
    };

    const handleGroup = (groupName, userSelected, masterId, masterCompanyId) => {

        if (!groupName && !userSelected && ids && !masterId && !masterCompanyId) return null;

        // WebSocket connection (assuming ws is the WebSocket server URL)
        const socket = new WebSocket(webSocketUrl); // Replace with your WebSocket server URL

        socket.onopen = () => {
            const message = {
                sendType: 'group_create',
                groupName: groupName,
                userSelected: userSelected,
                ids: ids,  // The ID of the user creating the group (senderId)
                masterId: masterId,  // Master ID
                masterCompanyId: masterCompanyId,  // Master Company ID
            };

            socket.send(JSON.stringify(message));
        };

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            // Handle the response from WebSocket server if needed

        };

        socket.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        socket.onclose = () => {

        };

        // Simulate successful group creation and WebSocket call
        setTimeout(() => {
            // On success, close the modal and reset the form
            setModalVisible(false);
            setGroupName('');
            setSelectedUsers([]);
        }, 1000);
    };

    const handleClick = (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return; // Stop if validation fails
        }

        handleGroup(groupName, selectedUsers, masterId, masterCompanyId);
    };

    const handleSearchChange = (event) => {
        setSearchValue(event.target.value);
    };

    return (
        <div>
            <div className="d-flex flex-column flex-grow-1" id="kt_app_main">
                <div className="d-flex flex-column flex-grow-1">
                    <div id="kt_app_toolbar" className="app-toolbar py-6">
                        <div id="kt_app_toolbar_container" className="container-fluid d-flex align-items-stretch">
                            <div className="d-flex justify-content-between flex-wrap w-100">
                                <div className="page-title d-flex flex-column justify-content-center gap-1 me-3">
                                    <h1 className="page-heading d-flex flex-column justify-content-center text-dark fw-bold fs-3 m-0">
                                        Chat message
                                    </h1>
                                    <ul className="breadcrumb breadcrumb-separatorless fw-semibold fs-7 my-0">
                                        <li className="breadcrumb-item text-muted">Home</li>
                                        <li className="breadcrumb-item">
                                            <span className="bullet bg-gray-500 w-5px h-2px"></span>
                                        </li>
                                        <li className="breadcrumb-item text-muted">Apps</li>
                                        <li className="breadcrumb-item">
                                            <span className="bullet bg-gray-500 w-5px h-2px"></span>
                                        </li>
                                        <li className="breadcrumb-item text-muted">Chat</li>
                                    </ul>
                                </div>
                                <div className="d-flex align-items-center gap-2 gap-lg-3">
                                    {/* {isGroup && (
                                        <a href="#" className="btn btn-outline-secondary h-40px fs-7 fw-bold" data-bs-toggle="modal" data-bs-target="#kt_modal_view_users">Add Member</a>
                                    )} */}
                                    <div>
                                        {/* Trigger Button */}
                                        <button
                                            className="btn btn-primary h-40px fs-7 fw-bold"
                                            onClick={() => setModalVisible(true)} // Open modal when button is clicked
                                        >
                                            New Group
                                        </button>

                                        {/* Modal */}
                                        {modalVisible && (
                                            <div className="modal fade custom-modal show" style={{ display: 'block' }} tabIndex="-1" aria-labelledby="kt_modal_create_campaign_label" aria-hidden="false">
                                                <form>
                                                    <div className="modal-dialog modal-dialog-scrollable modal-dialog-centered">
                                                        <div className="modal-content">
                                                            <div className="modal-header">
                                                                <h5 className="modal-title" id="kt_modal_create_campaign_label">
                                                                    Create New Group
                                                                </h5>
                                                                <button
                                                                    type="button"
                                                                    className="btn-close"
                                                                    onClick={() => setModalVisible(false)} // Close modal when button is clicked
                                                                    aria-label="Close"
                                                                ></button>
                                                            </div>
                                                            <div className="modal-body">
                                                                {/* Form content */}
                                                                <div className="mb-3">
                                                                    <label htmlFor="groupName" className="form-label">
                                                                        Group Name
                                                                    </label>
                                                                    <input
                                                                        type="text"
                                                                        className={`form-control ${errors.groupName ? 'is-invalid' : ''}`}
                                                                        id="groupName"
                                                                        placeholder="Enter group name"
                                                                        value={groupName}
                                                                        onChange={handleGroupNameChange}
                                                                    />
                                                                    {errors.groupName && (
                                                                        <div className="invalid-feedback">{errors.groupName}</div>
                                                                    )}
                                                                </div>
                                                                <div className="mb-3">
                                                                    <label className="form-label">Select Users</label>
                                                                    <div>
                                                                        {userData && userData.length > 0 && userData.map((data, index) => (
                                                                            <div key={index} className="form-check">
                                                                                <input
                                                                                    className="form-check-input"
                                                                                    type="checkbox"
                                                                                    id={`user-${data.id}`}
                                                                                    value={data.id}
                                                                                    onChange={handleUserSelection}
                                                                                />
                                                                                <label className="form-check-label" htmlFor={`user-${data.id}`}>
                                                                                    {data.first_name + " " + data.last_name}
                                                                                </label>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                    {errors.selectedUsers && (
                                                                        <div className="text-danger">{errors.selectedUsers}</div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="modal-footer">
                                                                <button
                                                                    type="button"
                                                                    className="btn btn-secondary"
                                                                    onClick={() => setModalVisible(false)} // Close modal on click
                                                                >
                                                                    Close
                                                                </button>
                                                                <button onClick={handleClick} type="button" className="btn btn-primary">
                                                                    Save changes
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </form>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div id="kt_app_content" className="app-content flex-grow-1">
                        <div id="kt_app_content_container" className="container-fluid">
                            <div className="d-flex flex-column flex-lg-row">
                                <div className="flex-column flex-lg-row-auto w-100 w-lg-300px w-xl-400px mb-10 mb-lg-0">
                                    <div className="card card-flush">
                                        <div className="card-header pt-7" id="kt_chat_contacts_header">
                                            <form className="w-100 position-relative" autoComplete="off">
                                                <div className="d-flex align-items-center">
                                                    <i className="ki-outline ki-magnifier fs-3 text-gray-500 me-3"></i>
                                                    <input
                                                        type="text"
                                                        className="form-control form-control-solid"
                                                        name="search"
                                                        value={searchValue}
                                                        onChange={handleSearchChange}
                                                        placeholder="Search by username or email..."
                                                    />
                                                </div>
                                            </form>
                                        </div>
                                        <ChatList id={ids} masterId={masterId} setSelectId={setSelectId} setIsGroup={setIsGroup} setSelectedChat={setSelectedChat} setData={setData} searchValue={searchValue} />
                                    </div>
                                </div>
                                <ChatWindow selectedChat={selectedChat} id={ids} selectId={selectId} isGroup={isGroup} data={data} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal for Users View */}
            <div className="modal fade" id="kt_modal_view_users" tabIndex="-1" aria-hidden="true">
                <div className="modal-dialog mw-650px modal-dialog-centered">
                    <div className="modal-content">
                        <div className="modal-header pb-0 border-0 justify-content-end">
                            <div className="btn btn-sm btn-icon btn-active-color-primary" data-bs-dismiss="modal">
                                <i className="ki-outline ki-cross fs-1"></i>
                            </div>
                        </div>
                        <div className="modal-body scroll-y mx-5 mx-xl-18 pt-0 pb-15">
                            <div className="text-center mb-13">
                                <h1 className="mb-3">Browse Users</h1>
                                <div className="text-muted fw-semibold fs-5">If you need more info, please check out our <a href="#" className="link-primary fw-bold">Users Directory</a>.</div>
                            </div>
                            <div className="mb-15">
                                <div className="mh-375px scroll-y me-n7 pe-7">
                                    <div className="d-flex justify-content-between py-5 border-bottom border-gray-300 border-bottom-dashed">
                                        <div className="d-flex align-items-center">
                                            <span className="bullet bullet-dot bullet-dot-md bullet-primary me-5"></span>
                                            <div className="fw-bold text-gray-600">User A</div>
                                        </div>
                                    </div>
                                    {/* Repeat above block for other users */}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
