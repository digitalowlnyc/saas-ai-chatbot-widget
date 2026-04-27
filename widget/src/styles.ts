export const buildStyles = (accentColor: string): string => `
  :host {
    all: initial;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 16px;
    line-height: 1;
    color: #1e293b;
  }

  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  .bubble {
    position: fixed;
    bottom: 24px;
    right: 24px;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: ${accentColor};
    cursor: pointer;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    z-index: 2147483647;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    outline: none;
  }

  .bubble:hover {
    transform: scale(1.08);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
  }

  .bubble:focus-visible {
    outline: 3px solid ${accentColor};
    outline-offset: 3px;
  }

  .panel {
    position: fixed;
    bottom: 92px;
    right: 24px;
    width: 360px;
    height: 520px;
    background: #ffffff;
    border-radius: 16px;
    box-shadow: 0 8px 48px rgba(0, 0, 0, 0.16);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    z-index: 2147483646;
    transform: translateY(16px) scale(0.97);
    opacity: 0;
    pointer-events: none;
    transition: transform 0.22s ease, opacity 0.22s ease;
  }

  .panel.open {
    transform: translateY(0) scale(1);
    opacity: 1;
    pointer-events: all;
  }

  .header {
    padding: 16px 20px;
    background: ${accentColor};
    color: #ffffff;
    font-weight: 600;
    font-size: 15px;
    display: flex;
    align-items: center;
    gap: 10px;
    flex-shrink: 0;
  }

  .header-dot {
    width: 8px;
    height: 8px;
    background: #4ade80;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .messages {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    scroll-behavior: smooth;
  }

  .messages::-webkit-scrollbar {
    width: 4px;
  }

  .messages::-webkit-scrollbar-track {
    background: transparent;
  }

  .messages::-webkit-scrollbar-thumb {
    background: #e2e8f0;
    border-radius: 2px;
  }

  .message {
    max-width: 82%;
    padding: 10px 14px;
    border-radius: 14px;
    font-size: 14px;
    line-height: 1.55;
    word-break: break-word;
  }

  .message.user {
    background: ${accentColor};
    color: #ffffff;
    align-self: flex-end;
    border-bottom-right-radius: 4px;
  }

  .message.assistant {
    background: #f1f5f9;
    color: #1e293b;
    align-self: flex-start;
    border-bottom-left-radius: 4px;
  }

  .typing {
    background: #f1f5f9;
    align-self: flex-start;
    border-radius: 14px;
    border-bottom-left-radius: 4px;
    padding: 12px 16px;
    display: flex;
    gap: 5px;
    align-items: center;
  }

  .dot {
    width: 7px;
    height: 7px;
    background: #94a3b8;
    border-radius: 50%;
    animation: bounce 1.3s ease-in-out infinite;
  }

  .dot:nth-child(2) { animation-delay: 0.18s; }
  .dot:nth-child(3) { animation-delay: 0.36s; }

  @keyframes bounce {
    0%, 60%, 100% { transform: translateY(0); }
    30% { transform: translateY(-5px); }
  }

  .input-row {
    display: flex;
    align-items: flex-end;
    padding: 12px;
    gap: 8px;
    border-top: 1px solid #e2e8f0;
    flex-shrink: 0;
    background: #ffffff;
  }

  .input {
    flex: 1;
    padding: 10px 14px;
    border: 1.5px solid #e2e8f0;
    border-radius: 22px;
    font-size: 14px;
    font-family: inherit;
    outline: none;
    resize: none;
    line-height: 1.4;
    max-height: 100px;
    overflow-y: auto;
    color: #1e293b;
    background: #f8fafc;
    transition: border-color 0.15s;
  }

  .input:focus {
    border-color: ${accentColor};
    background: #ffffff;
  }

  .input::placeholder {
    color: #94a3b8;
  }

  .send-btn {
    width: 38px;
    height: 38px;
    border-radius: 50%;
    background: ${accentColor};
    color: #ffffff;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: opacity 0.15s, transform 0.15s;
    outline: none;
  }

  .send-btn:hover:not(:disabled) {
    transform: scale(1.08);
  }

  .send-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .send-btn:focus-visible {
    outline: 3px solid ${accentColor};
    outline-offset: 2px;
  }

  .error-msg {
    font-size: 12px;
    color: #ef4444;
    padding: 4px 14px 8px;
    text-align: center;
  }
`
