const App = {
    currentMeetingId: null,

    init() {
        this.setupEventListeners();
        // The load() method will be called by Auth.js once authenticated
    },

    async load() {
        // Personalize greeting
        const userDisplayName = document.getElementById('user-display-name').textContent;
        const heroName = document.getElementById('hero-user-name');
        if (heroName) heroName.textContent = userDisplayName.split(' ')[0];

        // Ensure marker is in right spot
        this.updateSidebarMarker('dashboard-view');
        
        await this.refreshDashboard();
    },

    setupEventListeners() {
        // View Switching
        document.querySelectorAll('.nav-links li[data-view]').forEach(item => {
            item.addEventListener('click', () => {
                const viewId = item.getAttribute('data-view');
                this.switchView(viewId);
                
                // Update active state in sidebar
                document.querySelectorAll('.nav-links li').forEach(li => li.classList.remove('active'));
                item.classList.add('active');
                
                this.updateSidebarMarker(viewId);
            });
        });

        // Search/Back button in Detail View
        document.getElementById('back-to-dashboard').addEventListener('click', () => {
            this.switchView('dashboard-view');
            
            // Sync sidebar
            document.querySelectorAll('.nav-links li').forEach(li => li.classList.remove('active'));
            const dashLi = document.querySelector('.nav-links li[data-view="dashboard-view"]');
            dashLi.classList.add('active');
            this.updateSidebarMarker('dashboard-view');
        });

        // Drop Zone functionality
        const dropZone = document.getElementById('drop-zone');
        const fileInput = document.getElementById('file-input');

        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.style.borderColor = 'var(--primary)';
            dropZone.style.background = 'rgba(99, 102, 241, 0.05)';
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.style.borderColor = 'rgba(255,255,255,0.1)';
            dropZone.style.background = 'rgba(255,255,255,0.02)';
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.style.borderColor = 'rgba(255,255,255,0.1)';
            dropZone.style.background = 'rgba(255,255,255,0.02)';
            this.handleFileUpload(e.dataTransfer.files);
        });

        dropZone.addEventListener('click', () => fileInput.click());

        fileInput.addEventListener('change', (e) => {
            this.handleFileUpload(e.target.files);
        });

        // Chat functionality
        document.getElementById('btn-chat-send').addEventListener('click', () => this.handleSendMessage());
        document.getElementById('chat-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleSendMessage();
        });
    },

    updateSidebarMarker(viewId) {
        const marker = document.getElementById('nav-marker');
        const activeLi = document.querySelector(`.nav-links li[data-view="${viewId}"]`);
        
        if (marker && activeLi) {
            marker.style.display = 'block';
            marker.style.top = `${activeLi.offsetTop}px`;
            marker.style.height = `${activeLi.offsetHeight}px`;
        } else if (marker) {
            marker.style.display = 'none';
        }
    },

    switchView(viewId) {
        document.querySelectorAll('.view').forEach(view => {
            view.classList.remove('active-view');
        });
        
        const targetView = document.getElementById(viewId);
        if (targetView) {
            targetView.classList.add('active-view');
        }

        // Update header logic
        const hero = document.querySelector('.welcome-hero');
        if (viewId === 'dashboard-view') {
            hero.style.display = 'block';
        } else {
            hero.style.display = 'none';
        }
    },

    async handleFileUpload(files) {
        if (!files || files.length === 0) return;

        const container = document.getElementById('upload-progress-container');
        const progressBar = document.getElementById('upload-progress-bar');
        const statusText = document.getElementById('upload-status-text');

        container.style.display = 'block';
        progressBar.style.width = '0%';
        statusText.textContent = 'Uploading and analyzing transcripts...';

        try {
            await API.uploadFiles(files, (percent) => {
                progressBar.style.width = `${percent}%`;
                if (percent === 100) statusText.textContent = 'Gemini AI is generating meeting intelligence...';
            });
            
            statusText.textContent = 'Analysis complete!';
            setTimeout(() => {
                container.style.display = 'none';
                this.switchView('dashboard-view');
                this.refreshDashboard();
                
                // Reset sidebar
                document.querySelectorAll('.nav-links li').forEach(li => li.classList.remove('active'));
                const dashLi = document.querySelector('.nav-links li[data-view="dashboard-view"]');
                dashLi.classList.add('active');
                this.updateSidebarMarker('dashboard-view');
            }, 1000);
        } catch (error) {
            statusText.textContent = 'Error: ' + error.message;
            console.error('Upload error:', error);
        }
    },

    async refreshDashboard() {
        const meetings = await API.fetchMeetings();
        UI.renderMeetingsList(meetings, (id) => this.showMeetingDetail(id));
        
        // Update stats
        document.getElementById('total-meetings-count').textContent = meetings.length;
        const totalActions = meetings.reduce((acc, m) => acc + (m.actionItemCount || 0), 0);
        document.getElementById('total-actions-count').textContent = totalActions;
        
        const avgSentiment = meetings.length > 0 
            ? (meetings.reduce((acc, m) => acc + (m.sentimentScore || 0), 0) / meetings.length).toFixed(2)
            : '0.0';
        document.getElementById('avg-sentiment-val').textContent = avgSentiment;
    },

    async showMeetingDetail(id) {
        this.currentMeetingId = id;
        const meeting = await API.fetchMeetingDetail(id);
        if (meeting) {
            UI.renderMeetingDetail(meeting);
            this.switchView('detail-view');
            
            // Clear and greet
            const chatMessages = document.getElementById('chat-messages');
            chatMessages.innerHTML = '';
            UI.appendMessage('ai', `I've finished analyzing **${meeting.title}**. Ask me about specific decisions, action items, or the general sentiment trend.`);
        }
    },

    async handleSendMessage() {
        const input = document.getElementById('chat-input');
        const query = input.value.trim();
        if (!query || !this.currentMeetingId) return;

        input.value = '';
        UI.appendMessage('user', query);

        // Show typing indicator
        UI.showTyping();

        try {
            const response = await API.sendMessage(this.currentMeetingId, query);
            UI.hideTyping();
            UI.appendMessage('ai', response.answer, response.citations);
        } catch (error) {
            UI.hideTyping();
            UI.appendMessage('ai', "I apologize, I encountered an issue processing your request.");
        }
    }
};

// Expose to window for Auth.js to call
window.App = App;

// Initial start
document.addEventListener('DOMContentLoaded', () => App.init());
