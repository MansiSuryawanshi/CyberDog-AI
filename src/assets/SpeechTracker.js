export function setupSpeechSystem() {
  const container = document.getElementById('speech-container');
  const bubble = document.getElementById('speech-bubble');
  const textElem = document.getElementById('speech-text');

  let queue = [];
  let isSpeaking = false;

  // Initial greeting
  queueMessage("System initialized. CyberDog active.");
  
  // Random chatter for testing
  setInterval(() => {
    if (Math.random() > 0.7) {
      const phrases = [
        "Scanning internal networks...",
        "Systems optimal.",
        "*whirring noise*",
        "Awaiting input.",
        "CPU load at 4%."
      ];
      queueMessage(phrases[Math.floor(Math.random() * phrases.length)]);
    }
  }, 10000);

  function queueMessage(text) {
    queue.push(text);
    processQueue();
  }

  function processQueue() {
    if (isSpeaking || queue.length === 0) return;

    isSpeaking = true;
    const msg = queue.shift();
    
    // Type out message
    textElem.textContent = '';
    container.classList.remove('hidden');
    bubble.classList.remove('hidden');
    bubble.classList.add('visible');

    let i = 0;
    const typingInterval = setInterval(() => {
      textElem.textContent += msg.charAt(i);
      i++;
      if (i >= msg.length) {
        clearInterval(typingInterval);
        
        // Wait then hide
        setTimeout(() => {
          bubble.classList.remove('visible');
          bubble.classList.add('hidden');
          setTimeout(() => {
            container.classList.add('hidden');
            isSpeaking = false;
            processQueue();
          }, 400); // Wait for transition
        }, 3000 + (msg.length * 50)); // Read time based on length
      }
    }, 50);
  }

  // Expose to window for external triggers
  window.cyberDogSpeak = queueMessage;
}
