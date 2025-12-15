import React, { useState, useEffect } from 'react';
import { supabase, Tables, InsertTables } from '../../lib/supabase';
import DataTable, { Column } from '../../components/admin/DataTable';

type CaseStudy = Tables<'case_studies'>;
type CaseStudyInsert = InsertTables<'case_studies'>;

const CaseStudiesEditor: React.FC = () => {
  const [caseStudies, setCaseStudies] = useState<CaseStudy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingCS, setEditingCS] = useState<CaseStudy | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState<CaseStudyInsert>({
    slug: '',
    title: '',
    subtitle: '',
    problem: '',
    solution: '',
    tech_stack: [],
    architecture: '',
    lessons: [],
  });
  const [techInput, setTechInput] = useState('');
  const [lessonInput, setLessonInput] = useState('');

  const fetchCaseStudies = async () => {
    try {
      const { data, error } = await supabase
        .from('case_studies')
        .select('*')
        .order('id', { ascending: true });

      if (error) throw error;
      setCaseStudies(data || []);
    } catch (err) {
      setError('Failed to load case studies');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCaseStudies();
  }, []);

  const resetForm = () => {
    setFormData({
      slug: '',
      title: '',
      subtitle: '',
      problem: '',
      solution: '',
      tech_stack: [],
      architecture: '',
      lessons: [],
    });
    setTechInput('');
    setLessonInput('');
    setEditingCS(null);
    setIsCreating(false);
  };

  const generateSlug = (title: string) => {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  };

  const handleTitleChange = (title: string) => {
    setFormData((prev) => ({
      ...prev,
      title,
      slug: editingCS ? prev.slug : generateSlug(title),
    }));
  };

  const handleAddTech = () => {
    const tech = techInput.trim();
    if (tech && !formData.tech_stack?.includes(tech)) {
      setFormData((prev) => ({ ...prev, tech_stack: [...(prev.tech_stack || []), tech] }));
      setTechInput('');
    }
  };

  const handleRemoveTech = (tech: string) => {
    setFormData((prev) => ({ ...prev, tech_stack: prev.tech_stack?.filter((t) => t !== tech) || [] }));
  };

  const handleAddLesson = () => {
    const lesson = lessonInput.trim();
    if (lesson && !formData.lessons?.includes(lesson)) {
      setFormData((prev) => ({ ...prev, lessons: [...(prev.lessons || []), lesson] }));
      setLessonInput('');
    }
  };

  const handleRemoveLesson = (lesson: string) => {
    setFormData((prev) => ({ ...prev, lessons: prev.lessons?.filter((l) => l !== lesson) || [] }));
  };

  const handleEdit = (cs: CaseStudy) => {
    setEditingCS(cs);
    setFormData({
      slug: cs.slug,
      title: cs.title,
      subtitle: cs.subtitle,
      problem: cs.problem,
      solution: cs.solution,
      tech_stack: cs.tech_stack || [],
      architecture: cs.architecture || '',
      lessons: cs.lessons || [],
    });
    setIsCreating(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const data = {
        ...formData,
        architecture: formData.architecture || null,
      };

      if (editingCS) {
        const { error } = await supabase
          .from('case_studies')
          .update(data)
          .eq('id', editingCS.id);

        if (error) throw error;
        setSuccess('Case study updated successfully');
      } else {
        const { error } = await supabase
          .from('case_studies')
          .insert(data);

        if (error) throw error;
        setSuccess('Case study created successfully');
      }

      await fetchCaseStudies();
      resetForm();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save case study';
      setError(message);
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (cs: CaseStudy) => {
    try {
      const { error } = await supabase
        .from('case_studies')
        .delete()
        .eq('id', cs.id);

      if (error) throw error;
      setSuccess('Case study deleted');
      await fetchCaseStudies();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete case study';
      setError(message);
    }
  };

  const columns: Column<CaseStudy>[] = [
    {
      key: 'title',
      header: 'Title',
      render: (cs) => (
        <div>
          <div className="text-white font-semibold">{cs.title}</div>
          <div className="text-[10px] text-[#525252]">/{cs.slug}</div>
        </div>
      ),
    },
    { key: 'subtitle', header: 'Subtitle' },
    {
      key: 'tech_stack',
      header: 'Tech Stack',
      render: (cs) => (
        <div className="flex flex-wrap gap-1">
          {cs.tech_stack?.slice(0, 3).map((t) => (
            <span key={t} className="px-1 text-[10px] bg-[#262626] text-[#a3a3a3]">{t}</span>
          ))}
          {(cs.tech_stack?.length || 0) > 3 && (
            <span className="text-[10px] text-[#525252]">+{(cs.tech_stack?.length || 0) - 3}</span>
          )}
        </div>
      ),
    },
  ];

  const showForm = isCreating || editingCS;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-space-grotesk font-bold text-white">Case Studies</h1>
          <p className="text-sm text-[#737373] font-mono">Detailed project breakdowns</p>
        </div>
        {!showForm && (
          <button
            onClick={() => { resetForm(); setIsCreating(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-[#2563EB] hover:bg-[#3b82f6] text-white text-sm font-mono transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Case Study
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-mono">{error}</div>
      )}
      {success && (
        <div className="mb-4 p-4 bg-green-500/10 border border-green-500/30 text-green-400 text-sm font-mono">{success}</div>
      )}

      {showForm && (
        <div className="mb-8 p-6 bg-[#0A0A0A] border border-[#262626]">
          <h2 className="text-lg font-space-grotesk font-semibold text-white mb-6">
            {editingCS ? 'Edit Case Study' : 'New Case Study'}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-[#525252] font-mono mb-2">Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="w-full px-4 py-2 bg-[#050505] border border-[#262626] text-white font-mono text-sm focus:outline-none focus:border-[#2563EB]"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest text-[#525252] font-mono mb-2">Slug *</label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                className="w-full px-4 py-2 bg-[#050505] border border-[#262626] text-white font-mono text-sm focus:outline-none focus:border-[#2563EB]"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-[10px] uppercase tracking-widest text-[#525252] font-mono mb-2">Subtitle *</label>
              <input
                type="text"
                value={formData.subtitle}
                onChange={(e) => setFormData((prev) => ({ ...prev, subtitle: e.target.value }))}
                className="w-full px-4 py-2 bg-[#050505] border border-[#262626] text-white font-mono text-sm focus:outline-none focus:border-[#2563EB]"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-[10px] uppercase tracking-widest text-[#525252] font-mono mb-2">Problem *</label>
              <textarea
                value={formData.problem}
                onChange={(e) => setFormData((prev) => ({ ...prev, problem: e.target.value }))}
                rows={4}
                className="w-full px-4 py-2 bg-[#050505] border border-[#262626] text-white font-mono text-sm focus:outline-none focus:border-[#2563EB] resize-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-[10px] uppercase tracking-widest text-[#525252] font-mono mb-2">Solution *</label>
              <textarea
                value={formData.solution}
                onChange={(e) => setFormData((prev) => ({ ...prev, solution: e.target.value }))}
                rows={4}
                className="w-full px-4 py-2 bg-[#050505] border border-[#262626] text-white font-mono text-sm focus:outline-none focus:border-[#2563EB] resize-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-[10px] uppercase tracking-widest text-[#525252] font-mono mb-2">Architecture (ASCII)</label>
              <textarea
                value={formData.architecture || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, architecture: e.target.value }))}
                rows={6}
                className="w-full px-4 py-2 bg-[#050505] border border-[#262626] text-white font-mono text-sm focus:outline-none focus:border-[#2563EB] resize-none"
                placeholder="ASCII art or text diagram..."
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest text-[#525252] font-mono mb-2">Tech Stack</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.tech_stack?.map((tech) => (
                  <span key={tech} className="flex items-center gap-1 px-2 py-1 bg-[#2563EB]/10 text-[#2563EB] text-xs font-mono">
                    {tech}
                    <button type="button" onClick={() => handleRemoveTech(tech)} className="hover:text-red-400">&times;</button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={techInput}
                  onChange={(e) => setTechInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTech())}
                  placeholder="Add tech..."
                  className="flex-1 px-4 py-2 bg-[#050505] border border-[#262626] text-white font-mono text-sm focus:outline-none focus:border-[#2563EB]"
                />
                <button type="button" onClick={handleAddTech} className="px-4 py-2 bg-[#262626] hover:bg-[#333] text-white text-sm font-mono">Add</button>
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest text-[#525252] font-mono mb-2">Lessons Learned</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.lessons?.map((lesson, i) => (
                  <span key={i} className="flex items-center gap-1 px-2 py-1 bg-[#84CC16]/10 text-[#84CC16] text-xs font-mono">
                    {lesson.length > 30 ? lesson.slice(0, 30) + '...' : lesson}
                    <button type="button" onClick={() => handleRemoveLesson(lesson)} className="hover:text-red-400">&times;</button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={lessonInput}
                  onChange={(e) => setLessonInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddLesson())}
                  placeholder="Add lesson..."
                  className="flex-1 px-4 py-2 bg-[#050505] border border-[#262626] text-white font-mono text-sm focus:outline-none focus:border-[#2563EB]"
                />
                <button type="button" onClick={handleAddLesson} className="px-4 py-2 bg-[#262626] hover:bg-[#333] text-white text-sm font-mono">Add</button>
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6 pt-6 border-t border-[#1f2937]">
            <button
              onClick={handleSave}
              disabled={isSaving || !formData.title || !formData.slug || !formData.subtitle || !formData.problem || !formData.solution}
              className="px-6 py-2 bg-[#2563EB] hover:bg-[#3b82f6] disabled:bg-[#2563EB]/50 disabled:cursor-not-allowed text-white text-sm font-mono transition-colors"
            >
              {isSaving ? 'Saving...' : editingCS ? 'Update' : 'Create'}
            </button>
            <button onClick={resetForm} className="px-6 py-2 bg-[#262626] hover:bg-[#333] text-white text-sm font-mono transition-colors">Cancel</button>
          </div>
        </div>
      )}

      <DataTable
        data={caseStudies}
        columns={columns}
        keyField="id"
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        searchFields={['title', 'slug', 'subtitle', 'tech_stack']}
        emptyMessage="No case studies found."
      />
    </div>
  );
};

export default CaseStudiesEditor;
