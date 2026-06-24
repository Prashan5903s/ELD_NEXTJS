let cache = {};

const CACHE_EXPIRATION_TIME = 5 * 60 * 1000; // Cache valid for 5 minutes

export async function getPermissions(token = null) {
    const BackEND = process.env.NEXT_PUBLIC_BACKEND_API_URL;

    if (!token) {
        return null;
    }

    // Check if the token exists in the cache and is not expired
    const cachedData = cache[token];
    if (cachedData && (Date.now() - cachedData.timestamp < CACHE_EXPIRATION_TIME)) {
        return cachedData.data;
    }

    // Avoid duplicate requests for the same token by using a promise queue
    if (cachedData?.promise) {
        return cachedData.promise;
    }

    try {
        const fetchPromise = fetch(`${BackEND}/transport/permission`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
        }).then(async (response) => {
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }
            const result = await response.json();
            cache[token] = { data: result, timestamp: Date.now() }; // Cache the result
            return result;
        });

        // Store the promise to avoid duplicate requests
        cache[token] = { promise: fetchPromise };

        return await fetchPromise;
    } catch (err) {
        console.error("Error fetching permissions:", err);
        throw err;
    }
}
