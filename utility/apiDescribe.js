// removed/describeVideo.js

// [1] Set up your constants here if they won't change frequently
const removed = "";
//const API_URL = "http://10.0.2.2:8083/describe-video";
const removed = ""

/*
[2] Export a function that references the file-level constants.
   - "payload" is your request body.
   - "removed" & "removed" come from above.
*/
export async function describeVideo(payload) {
    try {
        // [3] Make the POST request
        const response = await fetch(`${removed}/describe-video`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "removed": `${removed}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error("Failed to describe video");
        }

        // [4] Return the JSON response
        return await response.json();
    } catch (error) {
        console.error("Error describing video:", error);
        throw error;
    }
}

// Example placeholder function for hitting your removed delete endpoint
export async function deleteVideoOnServer(payload) {
    try {
        const response = await fetch(`${removed}/delete-video`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "removed": `${removed}`
            },
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            throw new Error('Failed to delete video');
        }
        // handle success
    } catch (error) {
        console.error('Delete error:', error);
    }
}

