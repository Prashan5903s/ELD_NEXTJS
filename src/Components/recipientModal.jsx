'use client';

import React, { useState, useEffect } from 'react';
import Skeleton from 'react-loading-skeleton';

function RecipientModal({ activeModal, closeModal, formValue, setRecipient, recipient, editData }) {
    const [userType, setUserType] = useState('fleetUser');
    const [selectAll, setSelectAll] = useState(false);

    useEffect(() => {
        if (editData?.recipient) {
            const selectedRecipients = editData.recipient.map((r) => String(r));
            setRecipient(selectedRecipients);
        }
    }, [editData, setRecipient]);

    const toggleRecipient = (id) => {
        const stringId = String(id);
        setRecipient((prev) =>
            prev.includes(stringId) ? prev.filter((r) => r != stringId) : [...prev, stringId]
        );
    };

    const toggleSelectAll = () => {
        setSelectAll(!selectAll);
        if (!selectAll) {
            setRecipient(formValue?.[userType]?.map(user => String(user.id)) || []);
        } else {
            setRecipient(editData?.recipient?.map(r => String(r.id)) || []);
        }
    };

    return (
        <div
            className={`modal ${activeModal ? 'show d-block' : 'd-none'}`}
            tabIndex={-1}
            role="dialog"
            style={{
                zIndex: 1050,
                position: 'fixed',
                left: 0,
                top: 0,
                width: '100vw',
                maxHeight: '100vh',
                background: 'rgba(0, 0, 0, 0.5)',
            }}
        >
            <div className="modal-dialog modal-lg modal-dialog-centered" style={{ maxWidth: '500px' }}>
                <div className="modal-content" style={{ maxHeight: "500px", overflowY: "auto" }}>
                    <div className="modal-header">
                        <h5 className="modal-title">Select Recipients</h5>
                        <button type="button" className="btn-close" onClick={closeModal}></button>
                    </div>

                    <div className="modal-body p-3">
                        <ul className="nav nav-tabs">
                            <li className="nav-item">
                                <a className={`nav-link ${userType === 'fleetUser' ? 'active' : ''}`} href="#" onClick={(e) => {
                                    e.preventDefault();
                                    setUserType('fleetUser');
                                    setSelectAll(false);
                                }}>Fleet Users</a>
                            </li>
                            <li className="nav-item">
                                <a className={`nav-link ${userType === 'driver' ? 'active' : ''}`} href="#" onClick={(e) => {
                                    e.preventDefault();
                                    setUserType('driver');
                                    setSelectAll(false);
                                }}>Drivers</a>
                            </li>
                        </ul>

                        <div className="mt-3">
                            {formValue?.[userType]?.length > 0 && (
                                <div className="form-check d-flex align-items-center">
                                    <input className="form-check-input" type="checkbox" id="selectAll" checked={selectAll} onChange={toggleSelectAll} />
                                    <label className="form-check-label ms-2" htmlFor="selectAll">
                                        {`Select all ${userType === 'fleetUser' ? 'fleet users' : 'drivers'}`}
                                        <br /><small className="text-muted">Includes any new {userType === 'fleetUser' ? 'fleet users' : 'drivers'} added to your company.</small>
                                    </label>
                                </div>
                            )}

                            {formValue ? (
                                formValue[userType]?.length > 0 ? (
                                    formValue[userType].map((user) => (
                                        <div key={user.id} className="form-check mt-2 d-flex align-items-center">
                                            <input className="form-check-input" type="checkbox" checked={recipient.includes(String(user.id))} onChange={() => toggleRecipient(user.id)} id={`recipient-${user.id}`} />
                                            <label className="form-check-label ms-2" htmlFor={`recipient-${user.id}`}>
                                                <strong>{user.first_name} {user.last_name}</strong>
                                                <br /><small className="text-muted">{user.email}</small>
                                            </label>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center text-muted mt-3">{`No ${userType === 'fleetUser' ? 'fleet users' : 'drivers'} found.`}</div>
                                )
                            ) : (
                                <>
                                    <Skeleton height={30} width="100%" className="mb-2" />
                                    <Skeleton height={30} width="100%" className="mb-2" />
                                    <Skeleton height={30} width="100%" className="mb-2" />
                                </>
                            )}
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button className="btn btn-light" onClick={closeModal}>Cancel</button>
                        <button className="btn btn-primary" onClick={closeModal}>Save</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default RecipientModal;