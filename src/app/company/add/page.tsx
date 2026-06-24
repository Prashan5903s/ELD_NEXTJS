"use client";
import { useEffect, useState } from "react";
import Form from "@/Components/add/form";
import Header from "../header";
import { useRouter } from "next/navigation";

export default function Page() {
    const [authenticated, setAuthenticated] = useState(false);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const url = process.env.NEXT_PUBLIC_BACKEND_API_URL;

    
    const addClick = (formData) => {
        
    };

    return (
        <>
            <Header />
            {!authenticated || loading ? null : (
                <Form userData={userData} subCl={addClick} />
            )}
        </>
    );
}
