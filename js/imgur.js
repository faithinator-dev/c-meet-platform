// Cloudinary Image Upload
// Simple setup: Just sign up at cloudinary.com and get your cloud name
// Enable "unsigned uploads" in Settings > Upload

const CLOUDINARY_CLOUD_NAME = 'dizrufnkw'; // Your Cloudinary cloud name
const CLOUDINARY_UPLOAD_PRESET = 'unsigned_preset'; // Replace with your upload preset name

async function uploadToImgur(file) {
    // Validate file
    if (!file) {
        throw new Error('No file provided');
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
        throw new Error('File size must be less than 10MB');
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
        throw new Error('File must be an image');
    }

    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

        const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error('Failed to upload to Cloudinary');
        }

        const data = await response.json();
        return data.secure_url; // Returns the HTTPS URL of the uploaded image
    } catch (error) {
        console.error('Cloudinary upload error:', error);
        throw new Error('Failed to upload image: ' + error.message);
    }
}

// Helper function to convert file to base64 (for other uses)
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
}
