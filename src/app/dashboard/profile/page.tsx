'use client'
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from 'next-auth/react';
import axios from "axios";

function AdminProfile() {
  const url = process.env.NEXT_PUBLIC_BACKEND_API_URL;
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);

  interface User {
    token: string;
    // Add other properties you expect in the user object
  }

  interface SessionData {
    user?: User;
    // Add other properties you expect in the session data
  }

  const { data: session } = useSession() as { data?: SessionData };

  const token = session && session.user && session?.user?.token;

  useEffect(() => {

    if (token) {
      axios
        .get(`${url}/user`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        .then((response) => {
          setAuthenticated(true);
          if (response.data.user_type === "TR") {
          } else if (response.data.user_type === "EC") {
            router.replace("/company/dashboard");
          } else {
            console.error("Invalid user type");
            router.replace("/");
          }
        })
        .catch((error) => {
          console.error("Error fetching user data:", error);
          router.replace("/");
        });
    } else {
      router.replace("/");
    }
  }, [token]);


  return (
    <div className='d-flex flex-column flex-column-fluid'>
      <div id='kt_app_toolbar' className='app-toolbar pt-6 pb-2'>
        <div
          id='kt_app_toolbar_container'
          className='app-container container-fluid d-flex align-items-stretch'
        >
          <div className='app-toolbar-wrapper d-flex flex-stack flex-wrap gap-4 w-100'>
            <div className='page-title d-flex flex-column justify-content-center gap-1 me-3'>
              <h1 className='page-heading d-flex flex-column justify-content-center text-gray-900 fw-bold fs-3 m-0'>
                Admin Profile
              </h1>
              <ul className='breadcrumb breadcrumb-separatorless fw-semibold fs-7 my-0'>
                <li className='breadcrumb-item text-muted'>
                  <Link href=''>
                    <Link href='' className='text-muted text-hover-primary'>
                      Home
                    </Link>
                  </Link>
                </li>
                <li className='breadcrumb-item'>
                  <span className='bullet bg-gray-500 w-5px h-2px'></span>
                </li>
                <li className='breadcrumb-item text-muted'>Account</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      <div id='kt_app_content' className='app-content flex-column-fluid'>
        <div
          id='kt_app_content_container'
          className='app-container container-fluid'
        >
          <div className='card mb-5 mb-xl-10'>
            <div className='card-body profiletop pt-9 pb-0'>
              <div className='d-flex flex-wrap flex-sm-nowrap'>
                <div className='me-7 mb-4'>
                  <div
                    className='image-input image-input-empty image-input-outline image-input-placeholder mb-3'
                    data-kt-image-input='true'
                  >
                    <div className='image-input-wrapper w-250px h-220px'>
                      <img
                        alt='picture'
                        loading='lazy'
                        width='150'
                        height='150'
                        decoding='async'
                        data-nimg='1'
                        src='https://preview.keenthemes.com/metronic8/demo39/assets/media/svg/files/blank-image.svg'
                        style={{ color: "transparent" }}
                      />
                    </div>
                    <label
                      className='btn btn-icon btn-circle btn-active-color-primary w-25px h-25px bg-body shadow'
                      data-kt-image-input-action='change'
                      data-bs-toggle='tooltip'
                      aria-label='Change avatar'
                    >
                      <i className='ki-outline ki-pencil fs-7'></i>
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
                </div>

                <div className='flex-grow-1'>
                  <div className='d-flex justify-content-between align-items-start flex-wrap mb-2'>
                    <div className='d-flex flex-column'>
                      <div className='d-flex align-items-center mb-2'>
                        <Link
                          href='#'
                          className='text-gray-900 text-hover-primary fs-2 fw-bold me-1'
                        >
                          Super Admin
                        </Link>
                      </div>
                      <div className='d-flex flex-wrap fw-semibold fs-6 mb-4 pe-2'>
                        <Link
                          href='#'
                          className='d-flex align-items-center text-gray-500 text-hover-primary me-5 mb-2'
                        >
                          <i className='ki-outline ki-profile-circle fs-4 me-1'></i>
                          Admin
                        </Link>
                        <Link
                          href='#'
                          className='d-flex align-items-center text-gray-500 text-hover-primary me-5 mb-2'
                        >
                          <i className='ki-outline ki-geolocation fs-4 me-1'></i>
                          HP
                        </Link>
                        <Link
                          href='#'
                          className='d-flex align-items-center text-gray-500 text-hover-primary mb-2'
                        >
                          <i className='ki-outline ki-sms fs-4'></i>aw@gmail.com
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div
            className='card mb-5 mb-xl-10 profileInfo'
            id='kt_profile_details_view'
          >
            <div className='card-header cursor-pointer'>
              <div className='card-title m-0'>
                <h3 className='fw-bold m-0'>Profile Details</h3>
              </div>
              <Link href='' className='btn-primary align-self-center'>
                Edit Profile
              </Link>
            </div>
            <div className='card-body p-9'>
              {/* Profile Details Rows */}
              <div className='row mb-7'>
                <label className='col-lg-4 fw-semibold text-muted'>
                  Full Name
                </label>
                <div className='col-lg-8'>
                  <span className='fw-bold fs-6 text-gray-800'>Max Smith</span>
                </div>
              </div>

              <div className='row mb-7'>
                <label className='col-lg-4 fw-semibold text-muted'>
                  Company
                </label>
                <div className='col-lg-8 fv-row'>
                  <span className='fw-semibold text-gray-800 fs-6'>
                    Keenthemes
                  </span>
                </div>
              </div>

              <div className='row mb-7'>
                <label className='col-lg-4 fw-semibold text-muted'>
                  Contact Phone
                  {/* Tooltip should ideally be handled by a React tooltip library */}
                  <span className='ms-1'>
                    <i className='ki-outline ki-information fs-7'></i>
                  </span>
                </label>
                <div className='col-lg-8 d-flex align-items-center'>
                  <span className='fw-bold fs-6 text-gray-800 me-2'>
                    044 3276 454 935
                  </span>
                  <span className='badge badge-success'>Verified</span>
                </div>
              </div>

              <div className='row mb-7'>
                <label className='col-lg-4 fw-semibold text-muted'>
                  Company Site
                </label>
                <div className='col-lg-8'>
                  <span className='fw-semibold fs-6 text-gray-800 text-hover-primary'>
                    keenthemes.com
                  </span>
                </div>
              </div>

              <div className='row mb-7'>
                <label className='col-lg-4 fw-semibold text-muted'>
                  Country
                  <span className='ms-1'>
                    <i className='ki-outline ki-information fs-7'></i>
                  </span>
                </label>
                <div className='col-lg-8'>
                  <span className='fw-bold fs-6 text-gray-800'>Germany</span>
                </div>
              </div>

              <div className='row mb-7'>
                <label className='col-lg-4 fw-semibold text-muted'>
                  Communication
                </label>
                <div className='col-lg-8'>
                  <span className='fw-bold fs-6 text-gray-800'>
                    Email, Phone
                  </span>
                </div>
              </div>

              <div className='row mb-10'>
                <label className='col-lg-4 fw-semibold text-muted'>
                  Allow Changes
                </label>
                <div className='col-lg-8'>
                  <span className='fw-semibold fs-6 text-gray-800'>Yes</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminProfile;
