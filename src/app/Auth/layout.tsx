'use client'
import Image from "next/image";
import Link from "next/link";
import { SessionProvider } from "next-auth/react";

export default function AuthLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <SessionProvider>
        <div className='d-flex flex-column flex-lg-row flex-column-fluid h-100'>
          <div className='d-flex flex-column overflow-y-auto flex-lg-row-fluid w-lg-50 p-10 order-2 order-lg-1 '>
            <div className='d-flex flex-center flex-column flex-lg-row-fluid'>
              <div className='w-lg-500px p-10'>{children}</div>
            </div>

            {/* <div className='d-flex flex-center flex-wrap px-5'>
            <div className='d-flex fw-semibold text-primary fs-base'>
              <Link href='#' className='px-5' target='_blank'>
                Terms
              </Link>

              <Link href='#' className='px-5' target='_blank'>
                Plans
              </Link>

              <Link href='#' className='px-5' target='_blank'>
                Contact Us
              </Link>
            </div>
          </div> */}
          </div>

          <div
            className='d-flex flex-lg-row-fluid w-lg-50 bgi-size-cover bgi-position-center order-1 order-lg-2'
            style={{ backgroundImage: "url('/media/misc/Truck.jpg')" }}
          >
            <div className='d-flex flex-column justify-content-lg-between flex-center py-15 px-5 px-md-15 w-100'>
              <Link href='/' className='mb-12 '>
                <Image
                  alt='Logo'
                  src='/media/logos/custom-1.png'
                  width={95} // Specify the width
                  height={75} // Specify the height
                  className="h-75px"
                />
              </Link>

              <h1 className='d-none d-lg-block text-white fs-2qx fw-bolder text-center mb-7'>
                Fast, Efficient and Productive
              </h1>
            </div>
          </div>
        </div>
      </SessionProvider>
    </>
  );
}
