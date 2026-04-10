const API = {
    // Helper to get auth header
    getHeaders() {
        const token = localStorage.getItem('mih_token');
        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        return headers;
    },

    async fetchMeetings() {
        try {
            const response = await fetch('/api/meetings', {
                headers: this.getHeaders()
            });
            if (response.status === 401) {
                // Token likely expired
                localStorage.removeItem('mih_token');
                location.reload();
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching meetings:', error);
            return [];
        }
    },

    async fetchMeetingDetail(id) {
        try {
            const response = await fetch(`/api/meetings/${id}`, {
                headers: this.getHeaders()
            });
            return await response.json();
        } catch (error) {
            console.error('Error fetching meeting detail:', error);
            return null;
        }
    },

    async uploadFiles(files, progressCallback) {
        const formData = new FormData();
        for (let i = 0; i < files.length; i++) {
            formData.append('files', files[i]);
        }

        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', '/api/upload', true);
            
            // Inject Auth token
            const token = localStorage.getItem('mih_token');
            if (token) {
                xhr.setRequestHeader('Authorization', `Bearer ${token}`);
            }

            xhr.upload.onprogress = (e) => {
                if (e.lengthComputable) {
                    const percent = Math.round((e.loaded / e.total) * 100);
                    progressCallback(percent);
                }
            };

            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve(JSON.parse(xhr.responseText));
                } else if (xhr.status === 401) {
                    localStorage.removeItem('mih_token');
                    location.reload();
                } else {
                    reject(new Error('Upload failed'));
                }
            };

            xhr.onerror = () => reject(new Error('Network error'));
            xhr.send(formData);
        });
    },

    async sendMessage(meetingId, query) {
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.getHeaders()
                },
                body: JSON.stringify({ meeting_id: meetingId, query })
            });
            return await response.json();
        } catch (error) {
            console.error('Error sending message:', error);
            return { answer: "Sorry, I encountered an error connecting to the AI." };
        }
    }
};
