import React, { useState, useRef, useCallback } from 'react';
import ContactScene from '../3d/ContactScene';
import { submitContact } from '../lib/api';

const Contact: React.FC = () => {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [triggerPulse, setTriggerPulse] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);

  // Trigger a pulse in the 3D scene
  const emitPulse = useCallback(() => {
    setTriggerPulse(Date.now());
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    setErrorMessage('');
    emitPulse(); // Trigger pulse on submit

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
      emitPulse(); // Trigger success pulse
    } catch (err) {
      console.error('Contact form error:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Failed to send message');
      setStatus('error');
    }
  };

  const handleFocus = (field: string) => {
    setFocusedField(field);
    emitPulse(); // Trigger pulse on focus
  };

  const handleBlur = () => {
    setFocusedField(null);
  };

  if (status === 'success') {
    return (
      <div className="relative w-full h-[100dvh] overflow-hidden bg-[#050505]">
        <div className="absolute inset-0 z-0">
          <ContactScene isSuccess={true} triggerPulse={triggerPulse} />
        </div>
        <div className="relative z-10 h-full flex items-center px-6 md:px-12 lg:px-20">
          <div>
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold text-white font-space-grotesk tracking-tight leading-none">
              SENT
            </h1>
            <p className="mt-6 text-[#666] text-sm md:text-base max-w-md leading-relaxed">
              Message received. I'll get back to you soon.
            </p>
            <button
              onClick={() => setStatus('idle')}
              className="mt-8 px-6 py-3 bg-[#22c55e] text-white text-sm font-medium tracking-wide hover:bg-[#16a34a] transition-colors"
            >
              SEND ANOTHER
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[100dvh] overflow-hidden bg-[#050505]">
      {/* 3D Background */}
      <div className="absolute inset-0 z-0">
        <ContactScene
          focusedField={focusedField}
          isSubmitting={status === 'submitting'}
          isSuccess={false}
          triggerPulse={triggerPulse}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-center px-6 md:px-12 lg:px-20 py-20">
        <div className="max-w-xl">
          {/* Bold Header - matching home page style */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white font-space-grotesk tracking-tight leading-none mb-4">
            GET IN
            <br />
            <span className="text-[#2563EB]">TOUCH</span>
          </h1>

          <p className="text-[#666] text-sm md:text-base max-w-md leading-relaxed mb-8">
            Have a project in mind or want to collaborate?
            Send me a message.
          </p>

          {/* Form */}
          <form
            ref={formRef}
            onSubmit={handleSubmit}
            className="w-full max-w-md"
          >
            {status === 'error' && (
              <div className="mb-4 px-3 py-2 border-l-2 border-red-500 bg-red-500/5 text-red-400 text-xs font-mono">
                {errorMessage || 'Failed to send. Please try again.'}
              </div>
            )}

            <div className="space-y-4">
              {/* Name & Email */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-[#666] tracking-widest uppercase mb-1.5 font-mono">
                    Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    onFocus={() => handleFocus('name')}
                    onBlur={handleBlur}
                    className={`w-full bg-transparent border-b-2 ${
                      focusedField === 'name' ? 'border-[#2563EB]' : 'border-[#222]'
                    } px-0 py-2 text-white text-sm focus:outline-none placeholder:text-[#444] transition-all duration-300`}
                    placeholder="Your name"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-[#666] tracking-widest uppercase mb-1.5 font-mono">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    onFocus={() => handleFocus('email')}
                    onBlur={handleBlur}
                    className={`w-full bg-transparent border-b-2 ${
                      focusedField === 'email' ? 'border-[#2563EB]' : 'border-[#222]'
                    } px-0 py-2 text-white text-sm focus:outline-none placeholder:text-[#444] transition-all duration-300`}
                    placeholder="you@email.com"
                  />
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-[10px] text-[#666] tracking-widest uppercase mb-1.5 font-mono">
                  Subject
                </label>
                <select
                  name="reason"
                  onFocus={() => handleFocus('reason')}
                  onBlur={handleBlur}
                  className={`w-full bg-transparent border-b-2 ${
                    focusedField === 'reason' ? 'border-[#2563EB]' : 'border-[#222]'
                  } px-0 py-2 text-white text-sm focus:outline-none appearance-none cursor-pointer transition-all duration-300`}
                >
                  <option value="general" className="bg-[#111]">General Inquiry</option>
                  <option value="swe" className="bg-[#111]">Software Engineering</option>
                  <option value="ml" className="bg-[#111]">Machine Learning / AI</option>
                  <option value="video" className="bg-[#111]">Video Production</option>
                  <option value="collab" className="bg-[#111]">Collaboration</option>
                </select>
              </div>

              {/* Message */}
              <div>
                <label className="block text-[10px] text-[#666] tracking-widest uppercase mb-1.5 font-mono">
                  Message
                </label>
                <textarea
                  name="message"
                  rows={3}
                  required
                  onFocus={() => handleFocus('message')}
                  onBlur={handleBlur}
                  className={`w-full bg-transparent border-b-2 ${
                    focusedField === 'message' ? 'border-[#2563EB]' : 'border-[#222]'
                  } px-0 py-2 text-white text-sm focus:outline-none resize-none placeholder:text-[#444] transition-all duration-300`}
                  placeholder="Tell me about your project..."
                ></textarea>
              </div>

              {/* Submit */}
              <div className="flex items-center gap-6 pt-4">
                <button
                  type="submit"
                  disabled={status === 'submitting'}
                  className="group px-6 py-3 bg-[#2563EB] text-white text-sm font-medium tracking-wide hover:bg-[#1d4ed8] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {status === 'submitting' ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      SENDING
                    </>
                  ) : (
                    <>
                      SEND MESSAGE
                      <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </>
                  )}
                </button>

                <a
                  href="mailto:ebenezereshetu@gmail.com"
                  className="text-[10px] text-[#444] hover:text-[#2563EB] transition-colors font-mono tracking-wide"
                >
                  OR EMAIL DIRECTLY
                </a>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Contact;
