import React, { useState, useEffect } from 'react';
import { supabase, Tables } from '../../lib/supabase';

type PageContent = Tables<'page_content'>;

interface PageConfig {
  slug: string;
  title: string;
  description: string;
  fields: { key: string; label: string; type: 'text' | 'textarea' | 'array' }[];
}

const PAGE_CONFIGS: PageConfig[] = [
  {
    slug: 'home',
    title: 'Home Page',
    description: 'Landing page content',
    fields: [
      { key: 'hero_title', label: 'Hero Title', type: 'text' },
      { key: 'hero_subtitle', label: 'Hero Subtitle', type: 'textarea' },
      { key: 'cta_text', label: 'CTA Text', type: 'text' },
    ],
  },
  {
    slug: 'about',
    title: 'About Page',
    description: 'About page content',
    fields: [
      { key: 'name', label: 'Name', type: 'text' },
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'bio', label: 'Bio', type: 'textarea' },
      { key: 'location', label: 'Location', type: 'text' },
    ],
  },
  {
    slug: 'contact',
    title: 'Contact Page',
    description: 'Contact page settings',
    fields: [
      { key: 'email', label: 'Contact Email', type: 'text' },
      { key: 'heading', label: 'Page Heading', type: 'text' },
      { key: 'subheading', label: 'Page Subheading', type: 'textarea' },
    ],
  },
];

const PagesEditor: React.FC = () => {
  const [pages, setPages] = useState<Record<string, PageContent>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [activePage, setActivePage] = useState<string>('home');
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchPages = async () => {
    try {
      const { data, error } = await supabase
        .from('page_content')
        .select('*');

      if (error) throw error;

      const pagesMap: Record<string, PageContent> = {};
      data?.forEach((page) => {
        pagesMap[page.page_slug] = page;
      });
      setPages(pagesMap);

      // Set initial form data
      if (pagesMap[activePage]) {
        setFormData(pagesMap[activePage].content as Record<string, unknown>);
      }
    } catch (err) {
      setError('Failed to load page content');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPages();
  }, []);

  useEffect(() => {
    if (pages[activePage]) {
      setFormData(pages[activePage].content as Record<string, unknown>);
    } else {
      setFormData({});
    }
  }, [activePage, pages]);

  const handleFieldChange = (key: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const existingPage = pages[activePage];

      if (existingPage) {
        const { error } = await supabase
          .from('page_content')
          .update({ content: formData })
          .eq('id', existingPage.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('page_content')
          .insert({
            page_slug: activePage,
            content: formData,
          });

        if (error) throw error;
      }

      setSuccess('Page content saved successfully');
      await fetchPages();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save page content';
      setError(message);
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const activeConfig = PAGE_CONFIGS.find((p) => p.slug === activePage);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-[#525252] font-mono text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-space-grotesk font-bold text-white">Page Content</h1>
        <p className="text-sm text-[#737373] font-mono">Edit static page content</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-mono">{error}</div>
      )}
      {success && (
        <div className="mb-4 p-4 bg-green-500/10 border border-green-500/30 text-green-400 text-sm font-mono">{success}</div>
      )}

      {/* Page tabs */}
      <div className="flex gap-2 mb-6 border-b border-[#262626]">
        {PAGE_CONFIGS.map((config) => (
          <button
            key={config.slug}
            onClick={() => setActivePage(config.slug)}
            className={`px-4 py-2 text-sm font-mono transition-colors ${
              activePage === config.slug
                ? 'text-[#2563EB] border-b-2 border-[#2563EB]'
                : 'text-[#737373] hover:text-white'
            }`}
          >
            {config.title}
          </button>
        ))}
      </div>

      {/* Form */}
      {activeConfig && (
        <div className="p-6 bg-[#0A0A0A] border border-[#262626]">
          <div className="mb-6">
            <h2 className="text-lg font-space-grotesk font-semibold text-white">{activeConfig.title}</h2>
            <p className="text-sm text-[#525252] font-mono">{activeConfig.description}</p>
          </div>

          <div className="space-y-6">
            {activeConfig.fields.map((field) => (
              <div key={field.key}>
                <label className="block text-[10px] uppercase tracking-widest text-[#525252] font-mono mb-2">
                  {field.label}
                </label>
                {field.type === 'textarea' ? (
                  <textarea
                    value={(formData[field.key] as string) || ''}
                    onChange={(e) => handleFieldChange(field.key, e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 bg-[#050505] border border-[#262626] text-white font-mono text-sm focus:outline-none focus:border-[#2563EB] resize-none"
                  />
                ) : (
                  <input
                    type="text"
                    value={(formData[field.key] as string) || ''}
                    onChange={(e) => handleFieldChange(field.key, e.target.value)}
                    className="w-full px-4 py-2 bg-[#050505] border border-[#262626] text-white font-mono text-sm focus:outline-none focus:border-[#2563EB]"
                  />
                )}
              </div>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-[#1f2937]">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-2 bg-[#2563EB] hover:bg-[#3b82f6] disabled:bg-[#2563EB]/50 text-white text-sm font-mono transition-colors"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      {/* JSON Preview */}
      <div className="mt-6 p-4 bg-[#0A0A0A] border border-[#262626]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] uppercase tracking-widest text-[#525252] font-mono">JSON Preview</span>
        </div>
        <pre className="text-xs text-[#737373] font-mono overflow-x-auto">
          {JSON.stringify(formData, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default PagesEditor;
