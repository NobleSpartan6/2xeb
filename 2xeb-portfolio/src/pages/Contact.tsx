import React, { useState, useRef } from 'react';
import OrbitScene from '../3d/OrbitScene';
import { submitContact } from '../lib/api';

const Contact: React.FC = () => {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    setErrorMessage('');

    const form = formRef.current;
    if (!form) return;

    const formData = new FormData(form);

    try {
      await submitContact({
        name: formData.get('name') as string,
        email: formData.get('email') as string,
        message: formData.get('message') as string,
        reason: formData.get('reason') as string,
        source_page: '/contact',
      });
      setStatus('success');
    } catch (err) {
      console.error('Contact form error:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Failed to send message');
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="relative min-h-screen flex items-center justify-center bg-[#050505] overflow-hidden">
        <div className="absolute inset-0 z-0">
          <OrbitScene />
        </div>
        <div className="relative z-10 max-w-lg w-full bg-[#0A0A0A]/90 backdrop-blur-md p-16 border border-[#2563EB] text-center">
          <h2 className="text-4xl font-bold text-white mb-6 font-space-grotesk tracking-tighter">MESSAGE RECEIVED</h2>
          <p className="text-[#A3A3A3] mb-12 font-light">I will respond to your inquiry shortly.</p>
          <button onClick={() => setStatus('idle')} className="text-white bg-[#2563EB] px-8 py-3 font-bold uppercase tracking-widest text-xs hover:bg-white hover:text-black transition-colors">Send another</button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen pt-32 pb-12 px-6 md:px-12 overflow-hidden bg-[#050505]">
       <div className="absolute inset-0 z-0">
         <OrbitScene />
       </div>
       <div className="absolute inset-0 z-0 bg-black/60 pointer-events-none"></div>

      <div className="relative z-10 max-w-3xl mx-auto">
        <h1 className="text-6xl md:text-8xl font-bold text-white font-space-grotesk mb-16 text-center tracking-tighter leading-none">
          GET IN<br/>TOUCH
        </h1>

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-8 bg-[#0A0A0A]/40 backdrop-blur-sm p-8 border border-[#262626]">
          {status === 'error' && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 text-sm">
              {errorMessage || 'Something went wrong. Please try again.'}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="group">
              <label htmlFor="name" className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[#2563EB] mb-2">Name</label>
              <input
                type="text" id="name" name="name" required
                className="w-full bg-transparent border-b border-[#262626] py-4 text-white focus:outline-none focus:border-[#2563EB] transition-colors font-sans text-lg group-hover:border-white/50"
                placeholder="John Doe"
              />
            </div>

            <div className="group">
              <label htmlFor="email" className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[#2563EB] mb-2">Email</label>
              <input
                type="email" id="email" name="email" required
                className="w-full bg-transparent border-b border-[#262626] py-4 text-white focus:outline-none focus:border-[#2563EB] transition-colors font-sans text-lg group-hover:border-white/50"
                placeholder="john@example.com"
              />
            </div>
          </div>

          <div className="group pt-4">
            <label htmlFor="reason" className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[#2563EB] mb-2">Subject</label>
            <select
              id="reason" name="reason"
              className="w-full bg-transparent border-b border-[#262626] py-4 text-white focus:outline-none focus:border-[#2563EB] transition-colors font-sans text-lg appearance-none rounded-none"
            >
              <option className="bg-black">General Inquiry</option>
              <option className="bg-black">Software Engineering</option>
              <option className="bg-black">Machine Learning</option>
              <option className="bg-black">Video Production</option>
            </select>
          </div>

          <div className="group pt-4">
            <label htmlFor="message" className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[#2563EB] mb-2">Message</label>
            <textarea
              id="message" name="message" rows={4} required
              className="w-full bg-transparent border-b border-[#262626] py-4 text-white focus:outline-none focus:border-[#2563EB] transition-colors font-sans text-lg resize-none group-hover:border-white/50"
              placeholder="How can we collaborate?"
            ></textarea>
          </div>

          <div className="pt-8">
            <button
              type="submit"
              disabled={status === 'submitting'}
              className="w-full bg-white text-black font-bold py-6 hover:bg-[#2563EB] hover:text-white transition-colors disabled:opacity-50 uppercase tracking-[0.3em] text-sm"
            >
              {status === 'submitting' ? 'Transmitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Contact;
