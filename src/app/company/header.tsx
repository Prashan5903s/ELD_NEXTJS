"use client";
import Link from "next/link";
import "../../_metronic/assets/sass/style.scss";
import { useRouter } from "next/navigation";

export default function Header() {
    const router = useRouter();
    const url = process.env.NEXT_PUBLIC_BACKEND_API_URL;
    interface User {
        token: string;
        // Add other properties you expect in the user object
    }

    interface SessionData {
        user?: User;
        // Add other properties you expect in the session data
    };

    return (
        <nav className="navbar navbar-expand-lg navbar-light bg-light">
            <Link className="navbar-brand" href="/company/dashboard">
                Company
            </Link>
            <button
                className="navbar-toggler"
                type="button"
                data-toggle="collapse"
                data-target="#navbarNav"
                aria-controls="navbarNav"
                aria-expanded="false"
                aria-label="Toggle navigation"
            >
                <span className="navbar-toggler-icon"></span>
            </button>
            <div className="collapse navbar-collapse" id="navbarNav">
                <ul className="navbar-nav">
                    <li className="nav-item active">
                        <Link className="nav-link" href="/company/add">
                            Add
                        </Link>
                    </li>
                    <li className="nav-item active">
                        <span className="nav-link" >
                            Logout
                        </span>
                    </li>
                </ul>
            </div>
        </nav>
    );
}
