export function setupActionMenu() {
    // 1. Create Floating Action Menu
    const menuContainer = document.createElement('div');
    menuContainer.id = 'floating-action-menu';
    
    const triggerBtn = document.createElement('button');
    triggerBtn.id = 'menu-trigger';
    triggerBtn.innerHTML = '&#8593;'; // Up arrow

    const expandedMenu = document.createElement('div');
    expandedMenu.id = 'expanded-menu';
    
    // Add specific hover logic or rely entirely on CSS hover.
    // Given we want hover over robot OR the arrow maybe?
    // "When the user hovers over the robot or the arrow button, the arrow button expands smoothly"
    // To hover over the robot, it's the #app canvas. We can add event listeners to #app or rely on the proximity.
    // CSS hover on #floating-action-menu is probably what they meant, but let's bind it just to be safe.
    // We'll trust CSS on the menu area for now.

    const chatBtn = document.createElement('button');
    chatBtn.className = 'menu-action-btn';
    chatBtn.innerText = 'Chat';

    const policyBtn = document.createElement('button');
    policyBtn.className = 'menu-action-btn';
    policyBtn.innerText = 'Policy Details';

    expandedMenu.appendChild(chatBtn);
    expandedMenu.appendChild(policyBtn);

    menuContainer.appendChild(expandedMenu);
    menuContainer.appendChild(triggerBtn);
    document.body.appendChild(menuContainer);

    // 2. Chat Panel Container
    const chatPanel = document.createElement('div');
    chatPanel.id = 'chat-panel';
    chatPanel.className = 'hidden';
    chatPanel.innerHTML = `
        <div class="chat-header">
            <span>Assistant</span>
            <button id="chat-close">&times;</button>
        </div>
        <div class="chat-messages" id="chat-messages-container">
            <div class="chat-msg ai">Hi, how can I help you with policy-related questions?</div>
        </div>
        <div class="chat-input-area">
            <input type="text" id="chat-input" placeholder="Ask a question..." />
            <button id="chat-send">Send</button>
        </div>
    `;
    document.body.appendChild(chatPanel);

    // 3. Interactions
    chatBtn.addEventListener('click', () => {
        chatPanel.classList.remove('hidden');
    });

    document.getElementById('chat-close').addEventListener('click', () => {
        chatPanel.classList.add('hidden');
    });

    const chatInput = document.getElementById('chat-input');
    const chatSend = document.getElementById('chat-send');
    const msgsContainer = document.getElementById('chat-messages-container');

    const handleSend = async () => {
        const text = chatInput.value.trim();
        if (text !== '') {
            msgsContainer.innerHTML += `<div class="chat-msg user">${text}</div>`;
            chatInput.value = '';
            msgsContainer.scrollTop = msgsContainer.scrollHeight;

            // Add typing indicator
            const typingId = 'typing-' + Date.now();
            msgsContainer.innerHTML += `<div class="chat-msg ai" id="${typingId}">Sentinel is thinking...</div>`;
            msgsContainer.scrollTop = msgsContainer.scrollHeight;

            try {
                const response = await fetch('http://localhost:3001/api/policy/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: text })
                });

                const data = await response.json();
                
                // Replace typing indicator with real response
                const typingEl = document.getElementById(typingId);
                if (typingEl) {
                    // Simple markdown-ish conversion for the vanilla chat
                    const formattedText = data.text
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/• (.*?)\n/g, '• $1<br/>')
                        .replace(/\n/g, '<br/>');
                    
                    typingEl.innerHTML = formattedText;
                }
            } catch (error) {
                const typingEl = document.getElementById(typingId);
                if (typingEl) {
                    typingEl.innerText = "Error: Could not connect to policy assistant. Make sure the backend is running.";
                }
            }
            msgsContainer.scrollTop = msgsContainer.scrollHeight;
        }
    };

    chatSend.addEventListener('click', handleSend);
    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleSend();
    });

    policyBtn.addEventListener('click', () => {
        // Redirect to the static Policy Handbook (served by Vite)
        window.open('http://localhost:5174/policy.html', '_blank', 'width=1200,height=900');
    });

    // Special behavior: If they hover the app (robot context), expand the menu. 
    // We can also let the CSS #floating-action-menu:hover do the job. 
    const appEl = document.getElementById('app');
    if (appEl) {
        appEl.addEventListener('mouseenter', () => {
            menuContainer.classList.add('hovered');
        });
        menuContainer.addEventListener('mouseenter', () => {
            menuContainer.classList.add('hovered');
        });
        appEl.addEventListener('mouseleave', () => {
            menuContainer.classList.remove('hovered');
        });
        menuContainer.addEventListener('mouseleave', () => {
            menuContainer.classList.remove('hovered');
        });
    }
}

setupActionMenu();
