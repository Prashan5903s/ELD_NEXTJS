'use client'
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useSession } from 'next-auth/react';

export default function () {
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

    const { data } = useSession() as { data?: SessionData };
    const token = data?.user?.token;


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

}