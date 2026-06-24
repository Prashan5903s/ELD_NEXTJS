import React from 'react';
import Link from 'next/link';

const Registration: React.FC = () => {
  return (

    <form
      className='form w-100 fv-plugins-bootstrap5 fv-plugins-framework'
      noValidate
      id='kt_login_signup_form'
    >
      {/* begin::Heading */}
      <div className='text-center mb-11'>
        {/* begin::Title */}
        <h1 className='text-gray-900 fw-bolder mb-3'>Sign Up</h1>
        {/* end::Title */}

        <div className='text-gray-500 fw-semibold fs-6'>Your Social Campaigns</div>
      </div>
      {/* end::Heading */}

      {/* begin::Login options */}
      <div className='row g-3 mb-9'>
        {/* begin::Col */}
        <div className='col-md-6'>
          {/* begin::Google link */}
          <Link
            href='#'
            className='btn btn-flex btn-outline btn-text-gray-700 btn-active-color-primary bg-state-light flex-center text-nowrap w-100'
          >
            <img
              alt='Logo'
              src='media/svg/brand-logos/google-icon.svg'
              className='h-15px me-3'
            />
            Sign in with Google
          </Link>
          {/* end::Google link */}
        </div>
        {/* end::Col */}

        {/* begin::Col */}
        <div className='col-md-6'>
          {/* begin::Google link */}
          <Link
            href='#'
            className='btn btn-flex btn-outline btn-text-gray-700 btn-active-color-primary bg-state-light flex-center text-nowrap w-100'
          >

            <img
              alt='Logo'
              src=' https://i.pinimg.com/736x/65/22/5a/65225ab6d965e5804a632b643e317bf4.jpg'
              className='theme-dark-show h-15px me-3'
            />
            Sign in with Apple
          </Link>
          {/* end::Google link */}
        </div>
        {/* end::Col */}
      </div>
      {/* end::Login options */}

      <div className='separator separator-content my-14'>
        <span className='w-125px text-gray-500 fw-semibold fs-7'>Or with email</span>
      </div>


      {/* <div className='mb-lg-15 alert alert-danger'> */}
      {/* <div className='alert-text font-weight-bold'></div> */}
      {/* </div> */}

      {/* begin::Form group Firstname */}
      <div className='fv-row mb-8'>
        <label className='form-label fw-bolder text-gray-900 fs-6'>First name</label>
        <input
          placeholder='First name'
          type='text'
          autoComplete='off'
          className='form-control bg-transparent'
        />
        <div className='fv-plugins-message-container'>
          <div className='fv-help-block'>
            <span role='alert'></span>
          </div>
        </div>
      </div>
      {/* end::Form group */}
      <div className='fv-row mb-8'>
        {/* begin::Form group Lastname */}
        <label className='form-label fw-bolder text-gray-900 fs-6'>Last name</label>
        <input
          placeholder='Last name'
          type='text'
          autoComplete='off'
          className='form-control bg-transparent'
        />
        <div className='fv-plugins-message-container'>
          <div className='fv-help-block'>
            <span role='alert'></span>
          </div>
        </div>
        {/* end::Form group */}
      </div>

      {/* begin::Form group Email */}
      <div className='fv-row mb-8'>
        <label className='form-label fw-bolder text-gray-900 fs-6'>Email</label>
        <input
          placeholder='Email'
          type='email'
          autoComplete='off'
          className='form-control bg-transparent'
        />
        <div className='fv-plugins-message-container'>
          <div className='fv-help-block'>
            <span role='alert'></span>
          </div>
        </div>
      </div>
      {/* end::Form group */}

      {/* begin::Form group Password */}
      <div className='fv-row mb-8' data-kt-password-meter='true'>
        <div className='mb-1'>
          <label className='form-label fw-bolder text-gray-900 fs-6'>Password</label>
          <div className='position-relative mb-3'>
            <input
              type='password'
              placeholder='Password'
              autoComplete='off'
              className='form-control bg-transparent'
            />
            <div className='fv-plugins-message-container'>
              <div className='fv-help-block'>
                <span role='alert'></span>
              </div>
            </div>
          </div>
          {/* begin::Meter */}
          <div
            className='d-flex align-items-center mb-3'
            data-kt-password-meter-control='highlight'
          >
            <div className='flex-grow-1 bg-secondary bg-active-success rounded h-5px me-2'></div>
            <div className='flex-grow-1 bg-secondary bg-active-success rounded h-5px me-2'></div>
            <div className='flex-grow-1 bg-secondary bg-active-success rounded h-5px me-2'></div>
            <div className='flex-grow-1 bg-secondary bg-active-success rounded h-5px'></div>
          </div>
          {/* end::Meter */}
        </div>
        <div className='text-muted'>
          Use 8 or more characters with a mix of letters, numbers & symbols.
        </div>
      </div>
      {/* end::Form group */}

      {/* begin::Form group Confirm password */}
      <div className='fv-row mb-5'>
        <label className='form-label fw-bolder text-gray-900 fs-6'>Confirm Password</label>
        <input
          type='password'
          placeholder='Password confirmation'
          autoComplete='off'
          className='form-control bg-transparent'
        />
        {/* <div className='fv-plugins-message-container'> */}
        {/* <div className='fv-help-block'> */}
        {/* <span role='alert'></span> */}
        {/* </div> */}
        {/* </div> */}
      </div>
      {/* end::Form group */}

      {/* begin::Form group */}
      <div className='fv-row mb-8'>
        <label className='form-check form-check-inline' htmlFor='kt_login_toc_agree'>
          <input
            className='form-check-input'
            type='checkbox'
            id='kt_login_toc_agree'
          />
          <span>
            I Accept the{' '}
            <Link
              href='https://keenthemes.com/metronic/?page=faq'
              target='_blank'
              className='ms-1 link-primary'
            >
              Terms
            </Link>
            .
          </span>
        </label>


      </div>
      {/* end::Form group */}

      {/* begin::Form group */}
      <div className='text-center'>
        <button
          type='submit'
          id='kt_sign_up_submit'
          className='btn btn-lg btn-primary w-100 mb-5 '
          style={{ color: '#fff' }}
        >
          {/* {!loading && <span className='indicator-label'>Submit</span>} */}
          {/* {loading && ( */}
          {/* <span className='indicator-progress' style={{display: 'block'}}> */}
          {/* Please wait...{' '} */}
          {/* <span className='spinner-border spinner-border-sm align-middle ms-2'></span> */}
          {/* </span> */}
          {/* )} */}
          Submit
        </button>
        <Link href='./Login' >
          <button
            type='button'
            id='btn btn-lg btn-primary w-100 mb-5'
            className='btn btn-lg w-100 mb-5'
          >
            Cancel
          </button>
        </Link>
      </div>
      {/* end::Form group */}
    </form>
  )
};

export default Registration;
