import React from "react";
import Image from 'next/image';

interface ImagePopupModalProps {
    id: any;
    open: boolean;
    close: () => void;  // No arguments
    imageSrc: any;
}

const ImagePopupModal: React.FC<ImagePopupModalProps> = ({ id, close, open, imageSrc }) => {

    const getFileExtension = (url) => {
        try {
            // Create a new URL object
            const urlObject = new URL(url);
            // Extract the pathname from the URL
            const pathname = urlObject.pathname;
            // Split the pathname by '.' and get the last part
            const extension = pathname.split('.').pop();
            return extension;
        } catch (error) {
            console.error('Error parsing URL:', error);
            return null;
        }
    };

    const extension = getFileExtension(imageSrc);

    return (
        <div className={`modal ${open ? 'showpopup' : ''}`} aria-modal="true" role="dialog">
            <div className="modal-dialog modal-dialog-centered w-100 mw-650px">
                <div className="modal-content">
                    <div className="modal-header">
                        <h2 className="fw-bold">Image</h2>
                        <div className="btn btn-icon btn-sm btn-active-icon-primary" data-bs-dismiss="modal">
                            <i onClick={close} className="ki ki-outline ki-cross fs-1"></i>  {/* No argument passed */}
                        </div>
                    </div>
                    <div className="modal-body mx-5 mx-xl-15 my-7">
                        {extension === 'jpg' || extension === 'png' ? (
                            <Image
                                src={imageSrc}
                                alt="document-image"
                                layout="responsive"
                                style={{ objectFit: 'contain' }}
                                height={780}
                                width={1280} // Adjust this value as needed
                            />
                        ) : (
                            <embed
                                src={imageSrc}
                                style={{ display: 'block', width: '100%', height: '780px', objectFit: 'contain' }}
                            />
                        )}
                        {/* <img src={imageSrc} style={{ objectFit: "contain" }} alt="document-image" height={780} width="100%" /> */}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImagePopupModal;
