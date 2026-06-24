"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "../header";
import { useSession } from 'next-auth/react';
import axios from "axios";
import { SessionProvider } from "next-auth/react";

export default function Page() {
    const router = useRouter();
    const [users, setUsers] = useState([]);
    const url = process.env.NEXT_PUBLIC_BACKEND_API_URL;
    const front_url = process.env.NEXT_PUBLIC_FRONTEND_API_URL;

    // interface User {
    //     token: string;
    //     // Add other properties you expect in the user object
    // }

    // interface SessionData {
    //     user?: User;
    //     // Add other properties you expect in the session data
    // }

    // const { data } = useSession() as { data?: SessionData };
    // const token = data?.user?.token;


    // useEffect(() => {

    //     const fetchUsers = async () => {

    //         try {

    //             const response = await axios.get(
    //                 `${url}/company/user/index`,
    //                 {
    //                     headers: {
    //                         Authorization: `Bearer ${token}`,
    //                     },
    //                 }
    //             );
    //             setUsers(response.data);
    //         } catch (error) {
    //             console.error("Error fetching users:", error);
    //         }
    //     };

    //     fetchUsers();
    // }, [url, token]);

    return (
        <>
            <div className="container">
                <table className="table table-striped">
                    <thead>
                        <tr>
                            <th scope="col">ID</th>
                            <th scope="col">First Name</th>
                            <th scope="col">Last Name</th>
                            <th scope="col">Email</th>
                            <th scope="col">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* {users.map((user) => (
                            <tr key={user.id}>
                                <th scope="row">{user.id}</th>
                                <td>{user.first_name}</td>
                                <td>{user.last_name}</td>
                                <td>{user.email}</td>
                                <td>
                                    <Link href={`${front_url}/company/edit/${user.id}`}>Edit</Link>
                                </td>
                            </tr>
                        ))} */}
                    </tbody>
                </table>
            </div>
        </>
    );
}
