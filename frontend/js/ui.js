const UI = {
    renderMeetingsList(meetings, onClick) {
        const container = document.getElementById('meetings-list-container');
        if (!container) return;

        if (!meetings || meetings.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 4rem 2rem; opacity: 0.6;">
                    <i class="fa-solid fa-folder-open" style="font-size: 3rem; margin-bottom: 1.5rem; color: var(--primary);"></i>
                    <h3>No transcripts yet</h3>
                    <p>Your AI-analyzed meetings will appear here.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = '';
        const grid = document.createElement('div');
        grid.style.display = 'grid';
        grid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(320px, 1fr))';
        grid.style.gap = '1.5rem';
        
        meetings.forEach(m => {
            const card = document.createElement('div');
            card.className = 'card meeting-card';
            card.innerHTML = `
                <div style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--primary); margin-bottom: 0.75rem; font-weight: 700;">
                    ${this.formatTimeAgo(m.date)}
                </div>
                <h3 style="margin-bottom: 1rem; font-size: 1.25rem;">${m.title}</h3>
                <div style="display: flex; gap: 1rem; margin-bottom: 1.5rem;">
                    <span style="font-size: 0.85rem; color: var(--text-muted);"><i class="fa-regular fa-user" style="margin-right: 0.4rem;"></i> ${m.speakerCount} Speakers</span>
                    <span style="font-size: 0.85rem; color: var(--text-muted);"><i class="fa-regular fa-clock" style="margin-right: 0.4rem;"></i> ${m.actionItemCount} Actions</span>
                </div>
                <div style="display: flex; align-items: center; justify-content: space-between;">
                    <span class="badge" style="background: ${m.sentimentScore > 0.1 ? 'var(--pos-color)' : 'var(--neu-color)'}; color: white; border-radius: 6px; padding: 0.3rem 0.6rem; font-weight: 600;">
                        ${m.sentimentScore > 0.1 ? 'Positive' : 'Neutral'}
                    </span>
                    <i class="fa-solid fa-arrow-right" style="color: var(--primary); opacity: 0.5;"></i>
                </div>
            `;
            card.addEventListener('click', () => onClick(m.id));
            grid.appendChild(card);
        });
        container.appendChild(grid);
    },

    renderMeetingDetail(meeting) {
        document.getElementById('meeting-title-display').textContent = meeting.title;
        
        // Render Action Items
        const tableBody = document.getElementById('action-items-table');
        if (tableBody) {
            tableBody.innerHTML = '';
            meeting.actionItems.forEach(item => {
                const tr = document.createElement('tr');
                const category = (item.type || 'Action Item').toLowerCase();
                const badgeClass = category.includes('decision') ? 'decision' : 'action';
                const badgeColor = category.includes('decision') ? 'var(--secondary)' : 'var(--primary)';
                
                tr.innerHTML = `
                    <td style="padding: 1.25rem 0;"><span class="badge" style="background: ${badgeColor}22; color: ${badgeColor}; border: 1px solid ${badgeColor}44; font-weight: 700;">${item.type}</span></td>
                    <td style="font-weight: 500;">${item.what}</td>
                    <td style="color: var(--text-muted);"><i class="fa-regular fa-user" style="font-size: 0.8rem; margin-right: 0.4rem;"></i> ${item.who}</td>
                    <td style="color: var(--text-muted); font-size: 0.85rem;">${item.byWhen}</td>
                `;
                tr.style.borderBottom = '1px solid var(--border-glass)';
                tableBody.appendChild(tr);
            });
        }

        // Render Sentiment Timeline
        const timeline = document.getElementById('sentiment-timeline-viz');
        if (timeline) {
            timeline.innerHTML = '';
            meeting.sentimentTimeline.forEach(seg => {
                const el = document.createElement('div');
                el.style.flex = 1;
                let bg = 'var(--neu-color)';
                if (seg.score > 0.2) bg = 'var(--pos-color)';
                if (seg.score < -0.2) bg = 'var(--neg-color)';
                el.style.backgroundColor = bg;
                el.title = `${seg.time}: ${seg.text}`;
                timeline.appendChild(el);
            });
        }

        // Render Speaker Positivity
        const speakerList = document.getElementById('speaker-positivity-list');
        if (speakerList) {
            speakerList.innerHTML = '';
            meeting.speakers.forEach(sp => {
                const width = (sp.positivity * 100) + '%';
                const row = document.createElement('div');
                row.className = 'speaker-row';
                row.style.display = 'flex';
                row.style.alignItems = 'center';
                row.style.gap = '1.5rem';
                row.innerHTML = `
                    <div style="flex: 0 0 100px; font-weight: 600; font-size: 0.9rem;">${sp.name}</div>
                    <div style="flex: 1; height: 8px; background: rgba(255,255,255,0.05); border-radius: 4px; overflow: hidden; position: relative;">
                        <div style="width: ${width}; height: 100%; background: linear-gradient(to right, var(--primary), var(--secondary)); box-shadow: 0 0 10px var(--primary-glow);"></div>
                    </div>
                    <div style="flex: 0 0 40px; font-size: 0.8rem; color: var(--text-muted); text-align: right;">${Math.round(sp.positivity * 100)}%</div>
                `;
                speakerList.appendChild(row);
            });
        }
    },

    appendMessage(role, text, citations = []) {
        const history = document.getElementById('chat-messages');
        if (!history) return;

        const div = document.createElement('div');
        div.className = `message ${role === 'ai' ? 'ai-message' : 'user-message'}`;
        
        let citationHtml = '';
        if (citations && citations.length > 0) {
            citationHtml = '<div style="margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid rgba(255,255,255,0.1); display: flex; flex-wrap: wrap; gap: 0.5rem;">';
            citations.forEach(c => {
                citationHtml += `<span style="font-size: 0.7rem; background: rgba(255,255,255,0.1); padding: 0.2rem 0.5rem; border-radius: 4px; color: var(--text-muted);"><i class="fa-solid fa-quote-left" style="font-size: 0.6rem; margin-right: 0.3rem;"></i> ${c}</span>`;
            });
            citationHtml += '</div>';
        }

        div.innerHTML = `
            <div style="font-size: 0.95rem;">${text}</div>
            ${citationHtml}
        `;

        history.appendChild(div);
        history.scrollTop = history.scrollHeight;
    },

    showTyping() {
        const history = document.getElementById('chat-messages');
        const typing = document.createElement('div');
        typing.id = 'ai-typing-indicator';
        typing.className = 'message ai-message typing';
        typing.innerHTML = '<span></span><span></span><span></span>';
        history.appendChild(typing);
        history.scrollTop = history.scrollHeight;
    },

    hideTyping() {
        const indicator = document.getElementById('ai-typing-indicator');
        if (indicator) indicator.remove();
    },

    formatTimeAgo(dateString) {
        if (!dateString) return 'Just now';
        try {
            const date = new Date(dateString);
            const now = new Date();
            const diffInSeconds = Math.floor((now - date) / 1000);
            
            if (diffInSeconds < 60) return 'Just now';
            if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
            if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
            return date.toLocaleDateString();
        } catch (e) {
            return dateString;
        }
    }
};
