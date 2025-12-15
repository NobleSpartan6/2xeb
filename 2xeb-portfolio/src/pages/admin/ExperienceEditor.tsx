import React, { useState, useEffect } from 'react';
import { supabase, Tables, InsertTables } from '../../lib/supabase';
import DataTable, { Column } from '../../components/admin/DataTable';

type Experience = Tables<'experience'>;
type ExperienceInsert = InsertTables<'experience'>;

const TYPES = ['SWE', 'ML', 'VIDEO', 'HYBRID', 'OTHER'] as const;

const ExperienceEditor: React.FC = () => {
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingExp, setEditingExp] = useState<Experience | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState<ExperienceInsert>({
    company: '',
    role: '',
    date_range: '',
    location: '',
    description: '',
    skills: [],
    type: 'SWE',
    sort_order: 0,
  });
  const [skillInput, setSkillInput] = useState('');

  const fetchExperiences = async () => {
    try {
      const { data, error } = await supabase
        .from('experience')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setExperiences(data || []);
    } catch (err) {
      setError('Failed to load experiences');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExperiences();
  }, []);

  const resetForm = () => {
    const maxSortOrder = experiences.length > 0
      ? Math.max(...experiences.map(e => e.sort_order))
      : -1;

    setFormData({
      company: '',
      role: '',
      date_range: '',
      location: '',
      description: '',
      skills: [],
      type: 'SWE',
      sort_order: maxSortOrder + 1,
    });
    setSkillInput('');
    setEditingExp(null);
    setIsCreating(false);
  };

  const handleAddSkill = () => {
    const skill = skillInput.trim();
    if (skill && !formData.skills?.includes(skill)) {
      setFormData((prev) => ({
        ...prev,
        skills: [...(prev.skills || []), skill],
      }));
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills?.filter((s) => s !== skill) || [],
    }));
  };

  const handleEdit = (exp: Experience) => {
    setEditingExp(exp);
    setFormData({
      company: exp.company,
      role: exp.role,
      date_range: exp.date_range,
      location: exp.location,
      description: exp.description || '',
      skills: exp.skills || [],
      type: exp.type as typeof TYPES[number],
      sort_order: exp.sort_order,
    });
    setIsCreating(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      if (editingExp) {
        // Update existing
        const { error } = await supabase
          .from('experience')
          .update({
            ...formData,
            description: formData.description || null,
          })
          .eq('id', editingExp.id);

        if (error) throw error;
        setSuccess('Experience updated successfully');
      } else {
        // Create new
        const { error } = await supabase
          .from('experience')
          .insert({
            ...formData,
            description: formData.description || null,
          });

        if (error) throw error;
        setSuccess('Experience created successfully');
      }

      await fetchExperiences();
      resetForm();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save experience';
      setError(message);
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (exp: Experience) => {
    try {
      const { error } = await supabase
        .from('experience')
        .delete()
        .eq('id', exp.id);

      if (error) throw error;
      setSuccess('Experience deleted');
      await fetchExperiences();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete experience';
      setError(message);
    }
  };

  const columns: Column<Experience>[] = [
    {
      key: 'company',
      header: 'Company',
      render: (e) => (
        <div>
          <div className="text-white font-semibold">{e.company}</div>
          <div className="text-[10px] text-[#525252]">{e.role}</div>
        </div>
      ),
    },
    { key: 'date_range', header: 'Date', width: '140px' },
    { key: 'location', header: 'Location', width: '120px' },
    {
      key: 'type',
      header: 'Type',
      render: (e) => (
        <span className="text-[10px] uppercase tracking-wider text-[#737373]">{e.type}</span>
      ),
      width: '80px',
    },
    { key: 'sort_order', header: 'Order', width: '60px' },
  ];

  const showForm = isCreating || editingExp;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-space-grotesk font-bold text-white">Experience</h1>
          <p className="text-sm text-[#737373] font-mono">Manage work history</p>
        </div>
        {!showForm && (
          <button
            onClick={() => { resetForm(); setIsCreating(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-[#2563EB] hover:bg-[#3b82f6] text-white text-sm font-mono transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Experience
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
            {editingExp ? 'Edit Experience' : 'New Experience'}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-[#525252] font-mono mb-2">Company *</label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => setFormData((prev) => ({ ...prev, company: e.target.value }))}
                className="w-full px-4 py-2 bg-[#050505] border border-[#262626] text-white font-mono text-sm focus:outline-none focus:border-[#2563EB]"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest text-[#525252] font-mono mb-2">Role *</label>
              <input
                type="text"
                value={formData.role}
                onChange={(e) => setFormData((prev) => ({ ...prev, role: e.target.value }))}
                className="w-full px-4 py-2 bg-[#050505] border border-[#262626] text-white font-mono text-sm focus:outline-none focus:border-[#2563EB]"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest text-[#525252] font-mono mb-2">Date Range *</label>
              <input
                type="text"
                value={formData.date_range}
                onChange={(e) => setFormData((prev) => ({ ...prev, date_range: e.target.value }))}
                placeholder="Jan 2023 - Present"
                className="w-full px-4 py-2 bg-[#050505] border border-[#262626] text-white font-mono text-sm focus:outline-none focus:border-[#2563EB]"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest text-[#525252] font-mono mb-2">Location *</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                className="w-full px-4 py-2 bg-[#050505] border border-[#262626] text-white font-mono text-sm focus:outline-none focus:border-[#2563EB]"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest text-[#525252] font-mono mb-2">Type *</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData((prev) => ({ ...prev, type: e.target.value as typeof TYPES[number] }))}
                className="w-full px-4 py-2 bg-[#050505] border border-[#262626] text-white font-mono text-sm focus:outline-none focus:border-[#2563EB]"
              >
                {TYPES.map((t) => (<option key={t} value={t}>{t}</option>))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-[10px] uppercase tracking-widest text-[#525252] font-mono mb-2">Description</label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-4 py-2 bg-[#050505] border border-[#262626] text-white font-mono text-sm focus:outline-none focus:border-[#2563EB] resize-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-[10px] uppercase tracking-widest text-[#525252] font-mono mb-2">Skills</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.skills?.map((skill) => (
                  <span key={skill} className="flex items-center gap-1 px-2 py-1 bg-[#2563EB]/10 text-[#2563EB] text-xs font-mono">
                    {skill}
                    <button type="button" onClick={() => handleRemoveSkill(skill)} className="hover:text-red-400">&times;</button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                  placeholder="Add skill..."
                  className="flex-1 px-4 py-2 bg-[#050505] border border-[#262626] text-white font-mono text-sm focus:outline-none focus:border-[#2563EB]"
                />
                <button type="button" onClick={handleAddSkill} className="px-4 py-2 bg-[#262626] hover:bg-[#333] text-white text-sm font-mono">Add</button>
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6 pt-6 border-t border-[#1f2937]">
            <button
              onClick={handleSave}
              disabled={isSaving || !formData.company || !formData.role || !formData.date_range || !formData.location}
              className="px-6 py-2 bg-[#2563EB] hover:bg-[#3b82f6] disabled:bg-[#2563EB]/50 disabled:cursor-not-allowed text-white text-sm font-mono transition-colors"
            >
              {isSaving ? 'Saving...' : editingExp ? 'Update' : 'Create'}
            </button>
            <button onClick={resetForm} className="px-6 py-2 bg-[#262626] hover:bg-[#333] text-white text-sm font-mono transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      <DataTable
        data={experiences}
        columns={columns}
        keyField="id"
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        searchFields={['company', 'role', 'location', 'skills']}
        emptyMessage="No experience entries found."
      />
    </div>
  );
};

export default ExperienceEditor;
