'use client'
import React from "react";
import Image from "next/image";
import Link from "next/link";

function AddForm() {

    return (
        <div className={`d-flex flex-column flex-column-fluid showForm `} >
            {/* Toolbar */}
            <div id='kt_app_toolbar' className='app-toolbar pt-6 pb-2'>
                <div
                    id='kt_app_toolbar_container'
                    className='app-container container-fluid d-flex align-items-stretch'
                >
                    <div className='app-toolbar-wrapper d-flex flex-stack flex-wrap gap-4 w-100'>
                        {/* Page title */}
                        <div className='page-title d-flex flex-column justify-content-center gap-1 me-3'>
                            <h1 className='page-heading d-flex flex-column justify-content-center text-gray-900 fw-bold fs-3 m-0'>
                                White label company
                            </h1>
                            {/* Breadcrumb */}
                            <ul className='breadcrumb breadcrumb-separatorless fw-semibold fs-7 my-0'>
                                <li className='breadcrumb-item text-muted'>
                                    <Link
                                        href='#'
                                        className='text-muted text-hover-primary'>
                                        Home
                                    </Link>
                                </li>
                                <li className='breadcrumb-item'>
                                    <span className='bullet bg-gray-500 w-5px h-2px'></span>
                                </li>
                                <li className='breadcrumb-item text-muted'>
                                    <Link
                                        href=''
                                        className='text-muted text-hover-primary'
                                    >
                                        Transport
                                    </Link>
                                </li>
                                <li className='breadcrumb-item'>
                                    <span className='bullet bg-gray-500 w-5px h-2px'></span>
                                </li>
                                <li className='breadcrumb-item text-muted'>
                                    <Link
                                        href=''
                                        className='text-muted text-hover-primary'
                                    >
                                        Add
                                    </Link>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
            {/* Content */}
            <div id='kt_app_content' className='app-content flex-column-fluid'>
                <div
                    id='kt_app_content_container'
                    className='app-container container-fluid'
                >
                    {/* Form */}
                    <form
                        className='form d-flex flex-column flex-lg-row'
                    >
                        <input
                            type='hidden'
                            name='_token'
                            value='q92RHRRr6VG7xYGKO2YiFkxrXtLdf9wA6YsZ0yuW'
                        />
                        <div className='d-flex flex-column gap-7 gap-lg-10  w-lg-300px mb-7 me-lg-10'>
                            {/* Thumbnail settings */}
                            <div className='card card-flush py-4'>
                                <div className='card-header'>
                                    <div className='card-title'>
                                        <h2>Thumbnail</h2>
                                    </div>
                                </div>
                                <div className='card-body text-center pt-0'>
                                    {/* Image input */}
                                    <div
                                        className='image-input image-input-empty image-input-outline image-input-placeholder mb-3'
                                        data-kt-image-input='true'
                                    >
                                        <div className='image-input-wrapper w-250px h-220px'>
                                            <Image src={'https://preview.keenthemes.com/metronic8/demo39/assets/media/svg/files/blank-image.svg'} width={150} height={150} alt="picture" />
                                        </div>
                                        <label
                                            className='btn btn-icon btn-circle btn-active-color-primary w-25px h-25px bg-body shadow'
                                            data-kt-image-input-action='change'
                                            data-bs-toggle='tooltip'
                                            aria-label='Change avatar'
                                        >
                                            <i className='ki ki-pencil fs-7'></i>
                                            <input type='file' name='file' />
                                            <input type='hidden' name='avatar_remove' />
                                        </label>
                                        <span
                                            className='btn btn-icon btn-circle btn-active-color-primary w-25px h-25px bg-body shadow'
                                            data-kt-image-input-action='cancel'
                                        >
                                            <i className='ki ki-cross fs-2'></i>
                                        </span>
                                        <span
                                            className='btn btn-icon btn-circle btn-active-color-primary w-25px h-25px bg-body shadow'
                                            data-kt-image-input-action='remove'
                                        >
                                            <i className='ki ki-cross fs-2'></i>
                                        </span>
                                    </div>
                                    <div className='text-muted fs-7'>
                                        Set the company profile image. Only *.png, *.jpg and *.jpeg
                                        image files are accepted
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className='d-flex flex-column flex-row-fluid gap-7 gap-lg-10'>
                            <div className='tab-content'>
                                <div
                                    className='tab-pane fade show active'
                                    id='kt_ecommerce_add_product_general'
                                    role='tabpanel'
                                >
                                    <div className='d-flex flex-column gap-7 gap-lg-10'>
                                        <div className='card card-flush py-4'>
                                            <div className='card-body pt-0'>
                                                <div className='mb-10 fv-row'>
                                                    <label className='required form-label'>
                                                        Company Name
                                                    </label>
                                                    <input
                                                        type='text'
                                                        name='comp_name'
                                                        className='form-control mb-2'
                                                        placeholder='Company name'
                                                        required
                                                    />
                                                </div>
                                                <div className='mb-10 fv-row'>
                                                    <label className='required form-label'>
                                                        First Name
                                                    </label>
                                                    <input
                                                        type='text'
                                                        name='first_name'
                                                        className='form-control mb-2'
                                                        placeholder='First name'
                                                        required
                                                    />
                                                </div>
                                                <div className='mb-10 fv-row'>
                                                    <label className='required form-label'>
                                                        Last Name
                                                    </label>
                                                    <input
                                                        type='text'
                                                        name='last_name'
                                                        className='form-control mb-2'
                                                        placeholder='Last name'
                                                        required
                                                    />
                                                </div>
                                                <div className='mb-10 fv-row'>
                                                    <label className='required form-label'>Email</label>
                                                    <input
                                                        type='text'
                                                        name='last_name'
                                                        className='form-control mb-2'
                                                        placeholder='Email'
                                                        required
                                                    />
                                                </div>
                                                <div className='mb-10 fv-row'>
                                                    <label className='required form-label'>
                                                        Password
                                                    </label>
                                                    <input
                                                        type='text'
                                                        name='last_name'
                                                        className='form-control mb-2'
                                                        placeholder='Password'
                                                        required
                                                    />
                                                </div>
                                                <div className='mb-10 fv-row'>
                                                    <label className='required form-label'>
                                                        Confirm Password
                                                    </label>
                                                    <input
                                                        type='text'
                                                        name='last_name'
                                                        className='form-control mb-2'
                                                        placeholder='Confirm Password'
                                                        required
                                                    />
                                                </div>
                                                <div className='mb-10 fv-row'>
                                                    <label className='required form-label'>
                                                        Landline no
                                                    </label>
                                                    <input
                                                        type='text'
                                                        name='last_name'
                                                        className='form-control mb-2'
                                                        placeholder='Landline no'
                                                        required
                                                    />
                                                </div>
                                                <div className='mb-10 fv-row'>
                                                    <label className='required form-label'>
                                                        Mobile
                                                    </label>
                                                    <input
                                                        type='text'
                                                        name='last_name'
                                                        className='form-control mb-2'
                                                        placeholder='Mobile'
                                                        required
                                                    />
                                                </div>
                                                <div className='mb-10 fv-row'>
                                                    <label className='required form-label'>Country</label>
                                                    <select
                                                        name='country_id'
                                                        className='form-control mb-2'
                                                        id='country_id'
                                                        required
                                                    >
                                                        <option value=''>Select Country</option>
                                                        <option id='countrySel' value='1'>
                                                            Afghanistan
                                                        </option>
                                                        <option id='countrySel' value='25'>
                                                            Bhutan
                                                        </option>
                                                        <option id='countrySel' value='38'>
                                                            Canada
                                                        </option>
                                                        <option id='countrySel' value='101'>
                                                            India
                                                        </option>
                                                        <option id='countrySel' value='153'>
                                                            Nepal
                                                        </option>
                                                        <option id='countrySel' value='231'>
                                                            United States
                                                        </option>
                                                        <option id='countrySel' value='249'>
                                                            arab
                                                        </option>
                                                    </select>
                                                </div>
                                                <div className='mb-10 fv-row'>
                                                    <label className='required form-label'>State</label>
                                                    <select
                                                        name='state_id'
                                                        className='form-control mb-2'
                                                        id='state_id'
                                                        required
                                                    >
                                                        <option value='4346'>honey</option>
                                                        <option value='4347'>honey</option>
                                                    </select>
                                                </div>
                                                <div className='mb-10 fv-row'>
                                                    <label className='required form-label'>City</label>
                                                    <select
                                                        name='city_id'
                                                        className='form-control mb-2'
                                                        id='city_id'
                                                        required
                                                    >
                                                        <option value=''>Select City</option>
                                                        <option value='5914'>Bala Morghab</option>
                                                        <option value='5915'>Qal&apos;eh-ye Naw</option>
                                                    </select>
                                                </div>
                                                <div className='mb-10 fv-row'>
                                                    <label className='required form-label'>Pincode</label>
                                                    <input
                                                        type='text'
                                                        name='last_name'
                                                        className='form-control mb-2'
                                                        placeholder='Pincode'
                                                        required
                                                    />
                                                </div>
                                                <div className='mb-10 fv-row'>
                                                    <label className='required form-label'>Address</label>
                                                    <input
                                                        type='text'
                                                        name='last_name'
                                                        className='form-control mb-2'
                                                        placeholder='Address'
                                                        required
                                                    />
                                                </div>
                                                <div className='mb-10 fv-row'>
                                                    <label className='required form-label'>
                                                        Timezone
                                                    </label>
                                                    <select
                                                        name='timezone'
                                                        className='form-control mb-2'
                                                        required
                                                    >
                                                        <option value='(GMT+00:00) UTC'>
                                                            (GMT+00:00) UTC
                                                        </option>
                                                    </select>
                                                </div>{" "}
                                                <div className='mb-10 fv-row'>
                                                    <label className='required form-label'>Status</label>
                                                    <select
                                                        name='is_active'
                                                        className='form-control mb-2'
                                                    >
                                                        <option value='' disabled>
                                                            Select Status
                                                        </option>
                                                        <option value='1'>Active</option>
                                                        <option value='0'>Inactive</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className='d-flex justify-content-end'>
                                <Link href='/dashboard'
                                    className='btn-light me-5'
                                >
                                    Cancel
                                </Link>
                                <button
                                    type='submit'
                                    id='kt_ecommerce_add_product_submit'
                                    className='btn-primary'
                                >
                                    <span className='indicator-label'>Save Changes</span>
                                    <span className='indicator-progress'>
                                        Please wait...{" "}
                                        <span className='spinner-border spinner-border-sm align-middle ms-2'></span>
                                    </span>
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default AddForm;
