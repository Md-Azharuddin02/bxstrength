import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Bot, User, CheckCircle2, Phone, Mail, ShieldCheck, Zap, ArrowRight, Clock } from 'lucide-react';
import { VelocityAPI } from '../../services/api';
import { sendBrevoTicketEmail } from '../../services/emailService';

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timestamp: string;
  showForm?: boolean;
}

interface ChatbotWidgetProps {
  isOpen?: boolean;
  onClose?: () => void;
  onToggle?: () => void;
  onOpenConsultation?: () => void;
  hideFloatingButton?: boolean;
}

export const ChatbotWidget: React.FC<ChatbotWidgetProps> = ({
  isOpen: externalIsOpen,
  onClose: externalOnClose,
  onToggle: externalOnToggle,
  onOpenConsultation,
  hideFloatingButton = false
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState<boolean>(false);
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;

  const handleToggle = () => {
    if (externalOnToggle) {
      externalOnToggle();
    } else if (externalOnClose && isOpen) {
      externalOnClose();
    } else {
      setInternalIsOpen(!internalIsOpen);
    }
  };

  const handleClose = () => {
    if (externalOnClose) {
      externalOnClose();
    } else {
      setInternalIsOpen(false);
    }
  };

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-1',
      sender: 'bot',
      text: "👋 Welcome to BxStrength! I'm your AI Fitness Assistant. How can I help you achieve your goals today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputValue, setInputValue] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);

  // Human Support Escalation Form State
  const [showEscalationForm, setShowEscalationForm] = useState<boolean>(false);
  const [targetAgent, setTargetAgent] = useState<'CS Team' | 'Company Agent'>('CS Team');
  const [contactName, setContactName] = useState<string>('');
  const [contactEmail, setContactEmail] = useState<string>('');
  const [contactPhone, setContactPhone] = useState<string>('');
  const [contactMsg, setContactMsg] = useState<string>('');
  const [formSubmitted, setFormSubmitted] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, isTyping]);

  const quickQuestions = [
    { label: '🏋️ Coaching Programs', query: 'What coaching programs do you offer?' },
    { label: '📅 Book 15-Min Session', query: 'How can I book a 15-min discovery session?' },
    { label: '💰 Pricing & Packages', query: 'What are your pricing plans and session rates?' },
    { label: '👤 Talk with Agent', query: 'I want to speak with a human coach' },
  ];

  const processBotResponse = (userQuery: string) => {
    setIsTyping(true);
    const q = userQuery.toLowerCase();

    setTimeout(() => {
      let botAnswer = '';
      let triggerForm = false;

      if (q.includes('program') || q.includes('class') || q.includes('offer') || q.includes('train')) {
        botAnswer = "We offer 1-on-1 Virtual Personal Training covering Boxing Technique, Heavy Strength & Hypertrophy, Mobility & Joint Rehab, and Functional Movement. Programs are 100% tailor-made by our Head Coach & team.";
      } else if (q.includes('book') || q.includes('session') || q.includes('consult') || q.includes('free') || q.includes('15')) {
        botAnswer = "You can book a complimentary 15-minute 1-on-1 Strategy Session directly on our platform! Would you like me to open the booking calendar for you?";
      } else if (q.includes('price') || q.includes('cost') || q.includes('package') || q.includes('fee') || q.includes('rate')) {
        botAnswer = "Our 1-on-1 virtual coaching starts at $20 per session, with premium packages at $40, $60, and $80 depending on the level of dedicated 24/7 support and customized nutrition plans.";
      } else if (q.includes('human') || q.includes('coach') || q.includes('support') || q.includes('agent') || q.includes('talk') || q.includes('contact') || q.includes('phone') || q.includes('number')) {
        botAnswer = "I will connect you directly with our customer support team. Please fill in your details below so we can contact you directly via WhatsApp or Email!";
        triggerForm = true;
        setShowEscalationForm(true);
      } else {
        botAnswer = "Thank you for asking! For specific medical advice, custom schedules, or direct coach advice, our human coaching team can assist you directly. Would you like to leave a message for human support?";
        triggerForm = true;
        setShowEscalationForm(true);
      }

      setMessages(prev => [
        ...prev,
        {
          id: `msg-${Date.now()}`,
          sender: 'bot',
          text: botAnswer,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          showForm: triggerForm
        }
      ]);
      setIsTyping(false);
    }, 600);
  };

  const handleSendMessage = (textToSend?: string) => {
    const text = textToSend || inputValue;
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputValue('');
    processBotResponse(text.trim());
  };

  const handleEscalationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactEmail || !contactName) return;

    const ticketRef = 'BX-TKT-' + Math.floor(100000 + Math.random() * 900000);

    // Save lead in VelocityAPI Enquiry store
    VelocityAPI.createEnquiry({
      name: contactName,
      email: contactEmail,
      phone: contactPhone,
      subject: `[${targetAgent.toUpperCase()} CHATBOT ESCALATION] ${ticketRef}`,
      message: `[CHATBOT ROUTED TO ${targetAgent}]\nRef: ${ticketRef}\nAgent: ${targetAgent}\nMessage: ${contactMsg || 'User requested callback.'}`
    });

    // Save formal Ticket in Customer Support System
    const chatSnippet = messages.map(m => `${m.sender.toUpperCase()}: ${m.text}`).slice(-4).join('\n');
    VelocityAPI.createTicket({
      userName: contactName,
      userEmail: contactEmail,
      userPhone: contactPhone,
      subject: `[Chatbot Escalation] Request for ${targetAgent}`,
      category: 'Chatbot',
      priority: 'high',
      description: contactMsg || `Customer requested escalation to ${targetAgent} via website AI assistant.`,
      source: 'Chatbot',
      assignedAgent: targetAgent,
      chatContext: {
        botConversationSnippet: chatSnippet,
        escalatedAt: new Date().toISOString()
      }
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('bxstrength_tickets_updated'));
      window.dispatchEvent(new CustomEvent('bxstrength_enquiries_updated'));
    }

    // Send real email alert to Admin
    sendBrevoTicketEmail({
      ticketId: ticketRef,
      userName: contactName,
      userEmail: contactEmail,
      subject: `[${targetAgent}] Chatbot Inquiry from ${contactName}`,
      category: targetAgent === 'CS Team' ? 'Customer Support Team' : 'CST',
      priority: 'high',
      description: `[Routed to ${targetAgent}]\n${contactMsg || 'User requested support callback.'}`
    }).catch(() => {});

    setFormSubmitted(true);

    setMessages(prev => [
      ...prev,
      {
        id: `msg-${Date.now()}`,
        sender: 'bot',
        text: `✅ Thank you, ${contactName.split(' ')[0]}! Your inquiry (Ref: ${ticketRef}) has been routed directly to our ${targetAgent}. We will contact you at ${contactEmail} / WhatsApp shortly!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  return (
    <>
      {/* Standalone Floating Chat Button (Only if hideFloatingButton is false) */}
      {!hideFloatingButton && (
        <div className="fixed bottom-6 right-6 z-40 flex items-center gap-2">
          {!isOpen && (
            <div className="hidden sm:flex items-center gap-2 bg-[#18181b] border border-zinc-700 text-white px-3 py-1.5 rounded-full shadow-2xl animate-bounce text-xs font-bold">
              <Zap className="w-3.5 h-3.5 text-[#CCFF00]" />
              <span>Need Help? Chat with Us</span>
            </div>
          )}

          <button
            onClick={handleToggle}
            className="relative w-14 h-14 rounded-full bg-[#CCFF00] hover:bg-[#b8e600] text-black shadow-2xl flex items-center justify-center transition-all transform hover:scale-105 active:scale-95 cursor-pointer border-2 border-black"
            aria-label="Toggle AI Chat Assistant"
          >
            {isOpen ? (
              <X className="w-6 h-6 text-black" />
            ) : (
              <>
                <Bot className="w-7 h-7 text-black" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-black animate-pulse" />
              </>
            )}
          </button>
        </div>
      )}

      {/* Chat Modal Window */}
      {isOpen && (
        <div className="fixed bottom-20 sm:bottom-24 right-2 sm:right-6 z-40 w-[95vw] max-w-[420px] max-h-[82vh] sm:max-h-[600px] bg-[#121214] border border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-white font-sans animate-in slide-in-from-bottom-4 duration-200">
          
          {/* Header */}
          <div className="p-4 bg-[#18181b] border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#CCFF00] text-black flex items-center justify-center font-black">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase text-white flex items-center gap-1.5">
                  BxStrength AI Assistant
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </h3>
                <p className="text-[10px] text-zinc-400 font-semibold">AI Assistant Active</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Body */}
          <div className="p-4 overflow-y-auto flex-1 space-y-4 max-h-[380px] bg-[#121214]">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'bot' && (
                  <div className="w-7 h-7 rounded-lg bg-[#CCFF00] text-black flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[82%] p-3.5 rounded-2xl text-xs leading-relaxed space-y-2 ${
                    msg.sender === 'user'
                      ? 'bg-[#CCFF00] text-black font-semibold rounded-tr-none'
                      : 'bg-[#18181b] text-zinc-200 border border-zinc-800 rounded-tl-none'
                  }`}
                >
                  <p>{msg.text}</p>
                  <span
                    className={`block text-[9px] ${
                      msg.sender === 'user' ? 'text-zinc-800 text-right' : 'text-zinc-500'
                    }`}
                  >
                    {msg.timestamp}
                  </span>

                  {/* Trigger Consultation Modal Button if bot mentioned it */}
                  {msg.text.includes('booking calendar') && onOpenConsultation && (
                    <button
                      onClick={() => {
                        onOpenConsultation();
                        handleClose();
                      }}
                      className="mt-2 w-full bg-[#CCFF00] hover:bg-[#b8e600] text-black font-black text-[11px] uppercase tracking-wider py-2 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <span>OPEN BOOKING CALENDAR</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {msg.sender === 'user' && (
                  <div className="w-7 h-7 rounded-lg bg-zinc-700 text-white flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-2.5 items-center text-zinc-400 text-xs italic">
                <div className="w-7 h-7 rounded-lg bg-[#CCFF00] text-black flex items-center justify-center">
                  <Bot className="w-4 h-4" />
                </div>
                <span className="animate-pulse">Assistant is typing...</span>
              </div>
            )}

            {/* Human Support Escalation Form inside Chat */}
            {showEscalationForm && !formSubmitted && (
              <form
                onSubmit={handleEscalationSubmit}
                className="bg-[#18181b] border border-zinc-700 p-4 rounded-xl space-y-3 text-xs animate-in fade-in"
              >
                <div className="flex items-center justify-between text-[#CCFF00] font-black uppercase text-[11px]">
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-4 h-4" />
                    Connect with Support Agent
                  </span>
                </div>

                {/* CS Team */}
                <div>
                  <div className="grid grid-cols-1 gap-1.5 p-1 bg-[#121214] border border-zinc-700 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setTargetAgent('CS Team')}
                      className={`py-1.5 px-2 rounded-md font-bold text-[10px] uppercase transition-all cursor-pointer ${
                        targetAgent === 'CS Team'
                          ? 'bg-[#CCFF00] text-black shadow-sm font-black'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      Customer Support Team
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-300 uppercase mb-1">Your Name *</label>
                  <input
                    type="text"
                    required
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="e.g. Alex Smith"
                    className="w-full bg-[#121214] border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#CCFF00]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-300 uppercase mb-1">Email *</label>
                    <input
                      type="email"
                      required
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="alex@domain.com"
                      className="w-full bg-[#121214] border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#CCFF00]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-300 uppercase mb-1">Phone / WhatsApp</label>
                    <input
                      type="tel"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="+44 7911 123456"
                      className="w-full bg-[#121214] border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#CCFF00]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-300 uppercase mb-1">Message / Question</label>
                  <textarea
                    rows={2}
                    value={contactMsg}
                    onChange={(e) => setContactMsg(e.target.value)}
                    placeholder="How can our Head Coach & team help you?"
                    className="w-full bg-[#121214] border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#CCFF00]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#CCFF00] hover:bg-[#b8e600] text-black font-black uppercase tracking-wider py-2.5 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>SUBMIT TO SUPPORT TEAM</span>
                </button>
              </form>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Action Chips */}
          <div className="p-2.5 bg-[#18181b] border-t border-zinc-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {quickQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(q.query)}
                className="whitespace-nowrap text-[10px] font-bold uppercase bg-[#121214] hover:bg-zinc-800 text-zinc-300 hover:text-[#CCFF00] border border-zinc-700 px-3 py-1.5 rounded-full transition-colors flex-shrink-0 cursor-pointer"
              >
                {q.label}
              </button>
            ))}
          </div>

          {/* Input Footer */}
          <div className="p-3 bg-[#121214] border-t border-zinc-800 flex items-center gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask a question or type a message..."
              className="flex-1 bg-[#18181b] border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#CCFF00] transition-colors"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputValue.trim()}
              className="w-10 h-10 rounded-xl bg-[#CCFF00] hover:bg-[#b8e600] disabled:opacity-40 text-black flex items-center justify-center transition-all cursor-pointer flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
