export async function getPermissions(token = null) {
    const BackEND = process.env.NEXT_PUBLIC_BACKEND_API_URL;

    if (!token) {
        return null;
    }

    try {
        const response = await fetch(`${BackEND}/transport/permission`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error("Network response was not ok");
        }

        const resultText = await response.text();

        // Check if response is empty
        if (!resultText) {
            throw new Error("Empty response from server");
        }

        // Try parsing the response as JSON
        let result;
        try {
            result = JSON.parse(resultText);
        } catch (error) {
            throw new Error("Invalid JSON response");
        }
        return result;
    } catch (err) {
        console.error('Error fetching permissions:', err.message);
        throw err;
    }
}
