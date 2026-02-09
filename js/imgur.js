// Imgur API Integration
// You need to register your app at https://api.imgur.com/oauth2/addclient
// and get a Client ID

const IMGUR_CLIENT_ID = 'YOUR_IMGUR_CLIENT_ID'; // Replace with your Imgur Client ID

async function uploadToImgur(file) {
    // Validate file
    if (!file) {
        throw new Error('No file provided');
    }

    // Check file size (max 10MB for free Imgur)
    if (file.size > 10 * 1024 * 1024) {
        throw new Error('File size must be less than 10MB');
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
        throw new Error('File must be an image');
    }

    // Convert to base64
    const base64 = await fileToBase64(file);
    const base64Data = base64.split(',')[1]; // Remove data:image/...;base64, prefix

    try {
        const response = await fetch('https://api.imgur.com/3/image', {
            method: 'POST',
            headers: {
                'Authorization': `Client-ID ${IMGUR_CLIENT_ID}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                image: base64Data,
                type: 'base64'
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.data?.error || 'Failed to upload to Imgur');
        }

        const data = await response.json();
        return data.data.link; // Returns the direct link to the image
    } catch (error) {
        console.error('Imgur upload error:', error);
        throw new Error('Failed to upload image to Imgur: ' + error.message);
    }
}

// Helper function to convert file to base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
}

// Optional: Delete image from Imgur
async function deleteFromImgur(deleteHash) {
    try {
        const response = await fetch(`https://api.imgur.com/3/image/${deleteHash}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Client-ID ${IMGUR_CLIENT_ID}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to delete from Imgur');
        }

        return true;
    } catch (error) {
        console.error('Imgur delete error:', error);
        throw error;
    }
}

// Optional: Get image info
async function getImgurImageInfo(imageId) {
    try {
        const response = await fetch(`https://api.imgur.com/3/image/${imageId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Client-ID ${IMGUR_CLIENT_ID}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to get image info from Imgur');
        }

        const data = await response.json();
        return data.data;
    } catch (error) {
        console.error('Imgur get info error:', error);
        throw error;
    }
}
