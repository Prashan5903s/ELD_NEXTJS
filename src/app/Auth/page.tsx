'use client'
import React from 'react';
import Login from './login/page';
import AuthLayout from '@/app/Auth/layout';
function Authentication() {


  return (
    <AuthLayout>
      <Login />
    </AuthLayout>
  )
}

export default Authentication;
