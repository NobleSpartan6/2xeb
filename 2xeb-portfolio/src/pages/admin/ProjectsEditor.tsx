import React, { useState, useEffect } from 'react';
import { supabase, Tables, InsertTables, UpdateTables } from '../../lib/supabase';
import DataTable, { Column } from '../../components/admin/DataTable';

type Project = Tables<'projects'>;
type ProjectInsert = InsertTables<'projects'>;
type ProjectUpdate = UpdateTables<'projects'>;

const DISCIPLINES = ['SWE', 'ML', 'VIDEO', 'HYBRID'] as const;
const STATUSES = ['live', 'wip'] as const;

const ProjectsEditor: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState<ProjectInsert>({
    slug: '',
    title: '',
    short_desc: '',
    long_desc: '',
    primary_discipline: 'SWE',
    tags: [],
    created_at: new Date().toISOString().split('T')[0],
    video_url: '',
    image_url: '',
    status: 'wip',
    is_external: false,
    external_url: '',
    role: '',
    sort_order: 0,
  });
  const [tagInput, setTagInput] = useState('');

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setProjects(data || []);
    } catch (err) {
      setError('Failed to load projects');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const resetForm = () => {
    const maxSortOrder = projects.length > 0
      ? Math.max(...projects.map(p => p.sort_order))
      : -1;

    setFormData({
      slug: '',
      title: '',
      short_desc: '',
      long_desc: '',
      primary_discipline: 'SWE',
      tags: [],
      created_at: new Date().toISOString().split('T')[0],
      video_url: '',
      image_url: '',
      status: 'wip',
      is_external: false,
      external_url: '',
      role: '',
      sort_order: maxSortOrder + 1,
    });
    setTagInput('');
    setEditingProject(null);
    setIsCreating(false);
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleTitleChange = (title: string) => {
    setFormData((prev) => ({
      ...prev,
      title,
      slug: editingProject ? prev.slug : generateSlug(title),
    }));
  };

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (tag && !formData.tags?.includes(tag)) {
      setFormData((prev) => ({
        ...prev,
        tags: [...(prev.tags || []), tag],
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags?.filter((t) => t !== tag) || [],
    }));
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setFormData({
      slug: project.slug,
      title: project.title,
      short_desc: project.short_desc,
      long_desc: project.long_desc || '',
      primary_discipline: project.primary_discipline as typeof DISCIPLINES[number],
      tags: project.tags || [],
      created_at: project.created_at,
      video_url: project.video_url || '',
      image_url: project.image_url || '',
      status: project.status as typeof STATUSES[number] | undefined,
      is_external: project.is_external,
      external_url: project.external_url || '',
      role: project.role || '',
      sort_order: project.sort_order,
    });
    setIsCreating(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      if (editingProject) {
        const updateData: ProjectUpdate = {
          ...formData,
          long_desc: formData.long_desc || null,
          video_url: formData.video_url || null,
          image_url: formData.image_url || null,
          external_url: formData.external_url || null,
          role: formData.role || null,
        };

        const { error } = await supabase
          .from('projects')
          .update(updateData)
          .eq('id', editingProject.id);

        if (error) throw error;
        setSuccess('Project updated successfully');
      } else {
        const insertData: ProjectInsert = {
          ...formData,
          long_desc: formData.long_desc || null,
          video_url: formData.video_url || null,
          image_url: formData.image_url || null,
          external_url: formData.external_url || null,
          role: formData.role || null,
        };

        const { error } = await supabase
          .from('projects')
          .insert(insertData);

        if (error) throw error;
        setSuccess('Project created successfully');
      }

      await fetchProjects();
      resetForm();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save project';
      setError(message);
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (project: Project) => {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', project.id);

      if (error) throw error;
      setSuccess('Project deleted');
      await fetchProjects();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete project';
      setError(message);
    }
  };

  const columns: Column<Project>[] = [
    {
      key: 'title',
      header: 'Title',
      render: (p) => (
        <div>
          <div className="text-white font-semibold">{p.title}</div>
          <div className="text-[10px] text-[#525252]">/{p.slug}</div>
        </div>
      ),
    },
    {
      key: 'primary_discipline',
      header: 'Discipline',
      render: (p) => (
        <span
          className={`px-2 py-0.5 text-[10px] uppercase tracking-wider ${
            p.primary_discipline === 'SWE'
              ? 'bg-[#06B6D4]/10 text-[#06B6D4]'
              : p.primary_discipline === 'ML'
              ? 'bg-[#84CC16]/10 text-[#84CC16]'
              : p.primary_discipline === 'VIDEO'
              ? 'bg-[#F59E0B]/10 text-[#F59E0B]'
              : 'bg-[#8B5CF6]/10 text-[#8B5CF6]'
          }`}
        >
          {p.primary_discipline}
        </span>
      ),
      width: '100px',
    },
    {
      key: 'status',
      header: 'Status',
      render: (p) => (
        <span className={p.status === 'live' ? 'text-green-400' : 'text-yellow-400'}>
          {p.status || 'draft'}
        </span>
      ),
      width: '80px',
    },
    { key: 'sort_order', header: 'Order', width: '60px' },
  ];

  const showForm = isCreating || editingProject;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-space-grotesk font-bold text-white">Projects</h1>
          <p className="text-sm text-[#737373] font-mono">Manage portfolio projects</p>
        </div>
        {!showForm && (
          <button
            onClick={() => { resetForm(); setIsCreating(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-[#2563EB] hover:bg-[#3b82f6] text-white text-sm font-mono transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Project
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
            {editingProject ? 'Edit Project' : 'New Project'}
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
              <label className="block text-[10px] uppercase tracking-widest text-[#525252] font-mono mb-2">Short Description *</label>
              <input
                type="text"
                value={formData.short_desc}
                onChange={(e) => setFormData((prev) => ({ ...prev, short_desc: e.target.value }))}
                className="w-full px-4 py-2 bg-[#050505] border border-[#262626] text-white font-mono text-sm focus:outline-none focus:border-[#2563EB]"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-[10px] uppercase tracking-widest text-[#525252] font-mono mb-2">Long Description</label>
              <textarea
                value={formData.long_desc || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, long_desc: e.target.value }))}
                rows={4}
                className="w-full px-4 py-2 bg-[#050505] border border-[#262626] text-white font-mono text-sm focus:outline-none focus:border-[#2563EB] resize-none"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest text-[#525252] font-mono mb-2">Discipline *</label>
              <select
                value={formData.primary_discipline}
                onChange={(e) => setFormData((prev) => ({ ...prev, primary_discipline: e.target.value as typeof DISCIPLINES[number] }))}
                className="w-full px-4 py-2 bg-[#050505] border border-[#262626] text-white font-mono text-sm focus:outline-none focus:border-[#2563EB]"
              >
                {DISCIPLINES.map((d) => (<option key={d} value={d}>{d}</option>))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest text-[#525252] font-mono mb-2">Status</label>
              <select
                value={formData.status || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value as typeof STATUSES[number] | undefined }))}
                className="w-full px-4 py-2 bg-[#050505] border border-[#262626] text-white font-mono text-sm focus:outline-none focus:border-[#2563EB]"
              >
                <option value="">Draft</option>
                {STATUSES.map((s) => (<option key={s} value={s}>{s}</option>))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-[10px] uppercase tracking-widest text-[#525252] font-mono mb-2">Tags</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.tags?.map((tag) => (
                  <span key={tag} className="flex items-center gap-1 px-2 py-1 bg-[#2563EB]/10 text-[#2563EB] text-xs font-mono">
                    {tag}
                    <button type="button" onClick={() => handleRemoveTag(tag)} className="hover:text-red-400">&times;</button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  placeholder="Add tag..."
                  className="flex-1 px-4 py-2 bg-[#050505] border border-[#262626] text-white font-mono text-sm focus:outline-none focus:border-[#2563EB]"
                />
                <button type="button" onClick={handleAddTag} className="px-4 py-2 bg-[#262626] hover:bg-[#333] text-white text-sm font-mono">Add</button>
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest text-[#525252] font-mono mb-2">Video URL (YouTube)</label>
              <input
                type="text"
                value={formData.video_url || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, video_url: e.target.value }))}
                placeholder="https://youtube.com/watch?v=..."
                className="w-full px-4 py-2 bg-[#050505] border border-[#262626] text-white font-mono text-sm focus:outline-none focus:border-[#2563EB]"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest text-[#525252] font-mono mb-2">Image URL (optional)</label>
              <input
                type="text"
                value={formData.image_url || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, image_url: e.target.value }))}
                placeholder="Auto-generated from video if empty"
                className="w-full px-4 py-2 bg-[#050505] border border-[#262626] text-white font-mono text-sm focus:outline-none focus:border-[#2563EB]"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest text-[#525252] font-mono mb-2">Role</label>
              <input
                type="text"
                value={formData.role || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, role: e.target.value }))}
                placeholder="e.g. Lead Developer"
                className="w-full px-4 py-2 bg-[#050505] border border-[#262626] text-white font-mono text-sm focus:outline-none focus:border-[#2563EB]"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-[#525252] font-mono mb-2">
                <input
                  type="checkbox"
                  checked={formData.is_external}
                  onChange={(e) => setFormData((prev) => ({ ...prev, is_external: e.target.checked }))}
                  className="accent-[#2563EB]"
                />
                External Project
              </label>
              {formData.is_external && (
                <input
                  type="text"
                  value={formData.external_url || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, external_url: e.target.value }))}
                  placeholder="https://..."
                  className="w-full px-4 py-2 bg-[#050505] border border-[#262626] text-white font-mono text-sm focus:outline-none focus:border-[#2563EB]"
                />
              )}
            </div>
          </div>

          <div className="flex gap-3 mt-6 pt-6 border-t border-[#1f2937]">
            <button
              onClick={handleSave}
              disabled={isSaving || !formData.title || !formData.slug || !formData.short_desc}
              className="px-6 py-2 bg-[#2563EB] hover:bg-[#3b82f6] disabled:bg-[#2563EB]/50 disabled:cursor-not-allowed text-white text-sm font-mono transition-colors"
            >
              {isSaving ? 'Saving...' : editingProject ? 'Update' : 'Create'}
            </button>
            <button onClick={resetForm} className="px-6 py-2 bg-[#262626] hover:bg-[#333] text-white text-sm font-mono transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      <DataTable
        data={projects}
        columns={columns}
        keyField="id"
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        searchFields={['title', 'slug', 'short_desc', 'tags']}
        emptyMessage="No projects found. Click 'New Project' to create one."
      />
    </div>
  );
};

export default ProjectsEditor;
