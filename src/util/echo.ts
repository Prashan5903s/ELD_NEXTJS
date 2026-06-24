import Echo from "laravel-echo";
import Pusher from "pusher-js";

export function initEcho(token: string) {
    if (!(window as any).Pusher) {
        (window as any).Pusher = Pusher;
    }

    return new Echo({
        broadcaster: "pusher",
        key: process.env.NEXT_PUBLIC_PUSHER_APP_KEY!,
        cluster: process.env.NEXT_PUBLIC_PUSHER_APP_CLUSTER!, // e.g. "ap2"
        forceTLS: true,

        authEndpoint: `${process.env.NEXT_PUBLIC_ASSERT_URL}/broadcasting/auth`,
        auth: {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        },
    });
}
