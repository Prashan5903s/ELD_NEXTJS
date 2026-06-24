'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';

function ResetPassword() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const url = process.env.NEXT_PUBLIC_BACKEND_API_URL;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    const emailData = data['email'];
    try {
      const response = await fetch(`${url}/forgot/password/mail/${emailData}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401) {
        setMessage('Email does not exist.');
      } else if (!response.ok) {
        const errorData = await response.json();
        console.error('Error resetting password:', errorData);
        setMessage('An error occurred. Please try again.');
      } else {
        setMessage('Success! Please check your email.');
      }
    } catch (error) {
      setMessage('Failed to reset password. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      className="form w-100"
      noValidate
      id="kt_login_signin_form"
      onSubmit={handleSubmit(onSubmit)}
    >
      {/* Heading */}
      <div className="text-center mb-11">
        <h1 className="text-gray-900 fw-bolder mb-3">Forgot Password?</h1>
        <div className="text-gray-500 fw-semibold fs-6">
          Enter your email to reset your password.
        </div>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`alert ${
            message.includes('Failed') || message.includes('does not exist')
              ? 'alert-danger'
              : 'alert-success'
          }`}
        >
          <div className="alert-text font-weight-bold">{message}</div>
        </div>
      )}

      {/* Email Field */}
      <div className="fv-row mb-8">
        <input
          placeholder="Email"
          className={`form-control bg-transparent ${
            errors.email ? 'is-invalid' : ''
          }`}
          type="email"
          {...register('email', {
            required: 'Email is required',
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: 'Please enter a valid email address',
            },
          })}
          autoComplete="off"
        />
        {errors.email?.message && (
          <div className="fv-plugins-message-container mt-2">
            <span className="text-danger">{String(errors.email.message)}</span>
          </div>
        )}
      </div>

      {/* Submit & Cancel */}
      <div className="d-flex flex-wrap justify-content-center pb-lg-0 gap-10">
        <button
          type="submit"
          id="kt_sign_in_submit"
          className="btn btn-primary"
          disabled={loading}
        >
          {!loading && <span>Submit</span>}
          {loading && (
            <span className="indicator-progress" style={{ display: 'block' }}>
              Please wait...{' '}
              <span className="spinner-border spinner-border-sm align-middle ms-2"></span>
            </span>
          )}
        </button>
        <Link href="/" className="btn btn-light">
          <span>Cancel</span>
        </Link>
      </div>
    </form>
  );
}

export default ResetPassword;
