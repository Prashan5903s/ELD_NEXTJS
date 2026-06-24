"use client";
import { useState } from "react";
import Form from "@/Components/edit/form";
import Header from "../../header";
import { useRouter, useParams } from "next/navigation"; // Fix import

export default function Page() {
    const [authenticated, setAuthenticated] = useState(false);
    const [userData, setUserData] = useState(null);
    const router = useRouter();
    const { id } = useParams();
    const url = process.env.NEXT_PUBLIC_BACKEND_API_URL;

    const editClick = (formData) => {
        alert("hi");
    };

    return (
        <>
            <Header />
            <Form userData={userData} subCl={editClick} />
        </>
    );
}

