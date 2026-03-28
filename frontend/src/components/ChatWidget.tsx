import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send, Loader2, Bot } from 'lucide-react';

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', content: string, isFallback?: boolean }[]>([
    { role: 'ai', content: 'Hello! I am EasyMove Kenya Assistant. How can I help you with your tours or deliveries today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage })
      });
      const data = await response.json();
      setMessages(prev => [...prev, { role: 'ai', content: data.reply, isFallback: data.fallback }]);
    } catch (err) {
      console.error('Chat error:', err);
      setMessages(prev => [...prev, { role: 'ai', content: 'Sorry, I encountered an error. Please try again or contact us via WhatsApp.', isFallback: true }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-[100]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="absolute bottom-20 right-0 w-[350px] sm:w-[400px] h-[500px] bg-white rounded-[2.5rem] shadow-2xl border border-stone-200 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-secondary p-6 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-gradient rounded-xl flex items-center justify-center">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">EasyMove Kenya Assistant</h3>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[10px] uppercase tracking-widest text-stone-400 font-bold">Online</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-grow overflow-y-auto p-6 space-y-4 bg-bg-light/30">
              {messages.map((msg, i) => (
                <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[80%] p-4 rounded-2xl text-sm font-medium ${
                    msg.role === 'user' 
                      ? 'bg-primary text-white rounded-tr-none' 
                      : 'bg-white text-secondary border border-stone-100 rounded-tl-none shadow-sm'
                  }`}>
                    {msg.content}
                  </div>
                  {msg.isFallback && (
                    <motion.a
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      href={`https://wa.me/254712345678?text=Hi, I have a question about EasyMove Kenya services.`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 flex items-center gap-2 bg-emerald-500 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg shadow-emerald-500/20 hover:scale-105 transition-all"
                    >
                      Continue on WhatsApp
                    </motion.a>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-stone-100 shadow-sm">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-4 bg-white border-t border-stone-100 flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                className="flex-grow bg-bg-light border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 transition-all"
              />
              <button 
                type="submit"
                disabled={isLoading || !input.trim()}
                className="w-12 h-12 bg-primary-gradient text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 bg-primary-gradient text-white rounded-3xl flex items-center justify-center shadow-2xl shadow-primary/30 relative"
      >
        {isOpen ? <X className="w-8 h-8" /> : <MessageSquare className="w-8 h-8" />}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 border-4 border-white rounded-full" />
        )}
      </motion.button>
    </div>
  );
};

export default ChatWidget;
