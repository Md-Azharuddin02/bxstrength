import React, { useState, useEffect, useId } from 'react';
import { VelocityAPI, getApiUrl } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { sendContactEnquiryEmail } from '../services/emailService';
import { MapPin, Phone, Mail, Clock, Send, CheckCircle2, ShieldCheck, UserCheck } from 'lucide-react';

export const ContactView: React.FC = () => {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
    }
  }, [user]);

  const nameInputId = useId();
  const emailInputId = useId();
  const subjectInputId = useId();
  const messageInputId = useId();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && email && message) {
      const enqSubject = subject.trim() || 'General Website Enquiry';
      try {
        VelocityAPI.createEnquiry({
          name: name.trim(),
          email: email.trim(),
          subject: enqSubject,
          message: message.trim()
        });
      } catch (err) {
        console.error('Local storage enquiry save error:', err);
      }

      // Send notification email to admin
      sendContactEnquiryEmail({
        name: name.trim(),
        email: email.trim(),
        subject: enqSubject,
        message: message.trim()
      }).catch((err) => console.error('Failed to send contact notification email:', err));

      fetch(getApiUrl('/api/enquiries'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          subject: enqSubject,
          message: message.trim()
        })
      }).catch((err) => console.error('Enquiry server sync error:', err.message));

      setSubmitted(true);
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
      setTimeout(() => setSubmitted(false), 5000);
    }
  };

  return (
    <div className="bg-[#0a0a0a] text-white min-h-screen">
      {/* Header */}
      <div className="bg-[#121214] text-white py-16 border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-[11px] font-black tracking-widest text-zinc-400 uppercase bg-zinc-900 border border-zinc-800 px-3.5 py-1.5 rounded-full inline-block mb-3">
            GET IN TOUCH
          </span>
          <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white">
            CONTACT BXSTRENGTH
          </h1>
          <p className="text-zinc-400 text-sm max-w-xl mx-auto mt-2">
            Have questions about self-assessments, coach matching, or bespoke plans? Reach our London team.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12">
          
          {/* Contact Details Column */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <span className="text-xs font-black text-zinc-400 uppercase tracking-widest">
                UK HEADQUARTERS
              </span>
              <h2 className="text-2xl font-black uppercase text-white mt-1">
                CONTACT DETAILS
              </h2>
            </div>

            <div className="space-y-4 text-xs text-zinc-300">
              <div className="flex items-start gap-4 p-5 bg-[#121214] border border-zinc-800 rounded-xl">
                <MapPin className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-black text-white uppercase">HEADQUARTERS ADDRESS</p>
                  <p className="mt-1 text-zinc-300 font-semibold leading-relaxed">
                    185/A, Street no. 3, Zakir nagar, Okhla, New Delhi - 110025
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-5 bg-[#121214] border border-zinc-800 rounded-xl">
                <Mail className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-black text-white uppercase">EMAIL ADVISORY</p>
                  <a href="mailto:support@bxstrength.com" className="mt-1 text-white font-bold hover:underline block">
                    support@bxstrength.com
                  </a>
                  <p className="text-zinc-400 text-[11px]">24/7 Client Support &amp; Technical Queries</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-5 bg-[#121214] border border-zinc-800 rounded-xl">
                <Phone className="w-5 h-5 text-[#CCFF00] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-black text-white uppercase">CALL &amp; WHATSAPP SUPPORT</p>
                  <a href="https://wa.me/918423594482" target="_blank" rel="noopener noreferrer" className="mt-1 text-[#CCFF00] font-black text-sm hover:underline block">
                    8423594482
                  </a>
                  <p className="text-zinc-400 text-[11px]">Direct Line for Calls &amp; Instant WhatsApp Advisory</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form Column */}
          <div className="lg:col-span-7 bg-[#121214] p-6 sm:p-8 border border-zinc-800 rounded-xl space-y-6">
            <div>
              <span className="text-xs font-black text-zinc-400 uppercase tracking-widest">
                DIRECT INQUIRY
              </span>
              <h2 className="text-2xl font-black uppercase text-white mt-1">
                SEND AN INQUIRY
              </h2>
            </div>

            {submitted ? (
              <div className="p-6 bg-emerald-950/40 border border-emerald-800 text-emerald-300 rounded-lg text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                <h3 className="text-base font-black uppercase">MESSAGE SENT SUCCESSFULLY</h3>
                <p className="text-xs text-zinc-300">Thank you for reaching out to BxStrength. A dedicated head coach will review your inquiry within 24 hours.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor={nameInputId} className="block text-[11px] font-black uppercase tracking-wider text-zinc-300 mb-1">
                      YOUR NAME *
                    </label>
                    <input
                      id={nameInputId}
                      type="text"
                      required
                      placeholder="John Smith"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-[#18181b] border border-zinc-800 rounded-lg px-4 py-3 text-xs font-bold text-white focus:outline-none focus:border-white"
                    />
                  </div>

                  <div>
                    <label htmlFor={emailInputId} className="block text-[11px] font-black uppercase tracking-wider text-zinc-300 mb-1">
                      YOUR EMAIL *
                    </label>
                    <input
                      id={emailInputId}
                      type="email"
                      required
                      placeholder="john@example.co.uk"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-[#18181b] border border-zinc-800 rounded-lg px-4 py-3 text-xs font-bold text-white focus:outline-none focus:border-white"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor={subjectInputId} className="block text-[11px] font-black uppercase tracking-wider text-zinc-300 mb-1">
                    SUBJECT
                  </label>
                  <input
                    id={subjectInputId}
                    type="text"
                    placeholder="Discovery Consultation / Coach Matching Inquiry"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full bg-[#18181b] border border-zinc-800 rounded-lg px-4 py-3 text-xs font-bold text-white focus:outline-none focus:border-white"
                  />
                </div>

                <div>
                  <label htmlFor={messageInputId} className="block text-[11px] font-black uppercase tracking-wider text-zinc-300 mb-1">
                    YOUR MESSAGE *
                  </label>
                  <textarea
                    id={messageInputId}
                    required
                    rows={5}
                    placeholder="Tell us about your fitness targets, experience, or questions..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full bg-[#18181b] border border-zinc-800 rounded-lg px-4 py-3 text-xs font-bold text-white focus:outline-none focus:border-white"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="bg-white hover:bg-zinc-200 text-black font-black text-xs tracking-widest px-8 py-4 uppercase rounded-lg shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-colors w-full sm:w-auto"
                  id="btn-contact-submit"
                >
                  <Send className="w-4 h-4" /> SEND INQUIRY
                </button>
              </form>
            )}

          </div>

        </div>
      </div>
    </div>
  );
};

