import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';

interface GeneratedFiles {
  projects: string;
  experience: string;
}

const PublishContent: React.FC = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generated, setGenerated] = useState<GeneratedFiles | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const generateTypeScript = async () => {
    setIsGenerating(true);
    setError(null);
    setGenerated(null);

    try {
      // Fetch projects and experience in parallel
      const [projectsRes, experienceRes] = await Promise.all([
        supabase.from('projects').select('*').order('sort_order', { ascending: true }),
        supabase.from('experience').select('*').order('sort_order', { ascending: true }),
      ]);

      if (projectsRes.error) throw projectsRes.error;
      if (experienceRes.error) throw experienceRes.error;

      // Generate TypeScript files
      const projectsTs = generateProjectsFile(projectsRes.data || []);
      const experienceTs = generateExperienceFile(experienceRes.data || []);

      setGenerated({
        projects: projectsTs,
        experience: experienceTs,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to generate';
      setError(message);
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateProjectsFile = (projects: unknown[]): string => {
    const projectEntries = (projects as Record<string, unknown>[]).map((p) => {
      const videoUrl = p.video_url as string | undefined;
      const imageUrl = p.image_url
        ? `'${p.image_url}'`
        : videoUrl?.includes('youtube')
          ? `'https://img.youtube.com/vi/${extractYouTubeId(videoUrl)}/maxresdefault.jpg'`
          : 'undefined';

      return `  {
    id: ${p.id},
    slug: '${p.slug}',
    title: '${escapeString(p.title as string)}',
    shortDesc: '${escapeString(p.short_desc as string)}',
    ${p.long_desc ? `longDesc: '${escapeString(p.long_desc as string)}',` : ''}
    primaryDiscipline: Discipline.${p.primary_discipline},
    tags: [${(p.tags as string[]).map((t: string) => `'${t}'`).join(', ')}],
    createdAt: '${p.created_at}',
    ${p.video_url ? `videoUrl: '${p.video_url}',` : ''}
    imageUrl: ${imageUrl},
    status: '${p.status || 'live'}',
    ${p.is_external ? `isExternal: true,` : ''}
    ${p.external_url ? `externalUrl: '${p.external_url}',` : ''}
    ${p.role ? `role: '${escapeString(p.role as string)}'` : ''}
  }`;
    }).join(',\n');

    return `import { Discipline, Project } from '../lib/types';
import { SITE_INDEX } from './siteIndex';

export const PROJECTS: Project[] = [
${projectEntries}
];

/**
 * Build a compact context string for the AI assistant.
 */
export function buildProjectContext(): string {
  const projectsContext = PROJECTS.map(p =>
    \`- \${p.title} (\${p.slug}): \${p.primaryDiscipline} | \${p.shortDesc} | Tags: \${p.tags.join(', ')}\`
  ).join('\\n');

  const navContext = SITE_INDEX.map(page =>
    \`- \${page.title} (\${page.path}): \${page.description}\`
  ).join('\\n');

  return \`PROJECTS:\\n\${projectsContext}\\n\\nSITE NAVIGATION:\\n\${navContext}\`;
}
`;
  };

  const generateExperienceFile = (experience: unknown[]): string => {
    const entries = (experience as Record<string, unknown>[]).map((e) => `  {
    id: ${e.id},
    company: "${escapeString(e.company as string)}",
    role: "${escapeString(e.role as string)}",
    date: "${e.date_range}",
    location: "${e.location}",
    ${e.description ? `desc: "${escapeString(e.description as string)}",` : ''}
    ${(e.skills as string[])?.length ? `skills: [${(e.skills as string[]).map((s: string) => `"${s}"`).join(', ')}],` : ''}
    type: '${e.type}'
  }`).join(',\n');

    return `import { ExperienceItem } from '../lib/types';

export const EXPERIENCE: ExperienceItem[] = [
${entries}
];
`;
  };

  const escapeString = (str: string): string => {
    return str
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n');
  };

  const extractYouTubeId = (url: string): string => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([^&?/]+)/);
    return match ? match[1] : '';
  };

  const copyToClipboard = async (content: string, name: string) => {
    await navigator.clipboard.writeText(content);
    setCopied(name);
    setTimeout(() => setCopied(null), 2000);
  };

  const downloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/typescript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-space-grotesk font-bold text-white">Publish Content</h1>
        <p className="text-sm text-[#737373] font-mono mt-1">
          Generate TypeScript files from database content
        </p>
      </div>

      {/* How it works */}
      <div className="mb-8 p-6 bg-[#0A0A0A] border border-[#262626]">
        <h2 className="text-sm font-bold text-[#2563EB] uppercase tracking-widest mb-4">How This Works</h2>
        <ol className="text-sm text-[#A3A3A3] font-mono space-y-2">
          <li>1. Edit content in Projects/Experience editors</li>
          <li>2. Click "Generate TypeScript" below</li>
          <li>3. Copy or download the generated files</li>
          <li>4. Replace files in <code className="text-[#2563EB]">/src/data/</code></li>
          <li>5. Commit and deploy - site updates instantly</li>
        </ol>
        <p className="mt-4 text-xs text-[#525252] font-mono">
          This keeps your public site fast (static) while giving you a nice editing UI.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-mono">
          {error}
        </div>
      )}

      {/* Generate button */}
      <button
        onClick={generateTypeScript}
        disabled={isGenerating}
        className="px-6 py-3 bg-[#2563EB] hover:bg-[#3b82f6] disabled:bg-[#2563EB]/50 text-white font-mono text-sm transition-colors mb-8"
      >
        {isGenerating ? 'Generating...' : 'Generate TypeScript Files'}
      </button>

      {/* Generated output */}
      {generated && (
        <div className="space-y-8">
          {/* Projects */}
          <div className="bg-[#0A0A0A] border border-[#262626]">
            <div className="flex items-center justify-between p-4 border-b border-[#262626]">
              <div>
                <h3 className="text-white font-mono text-sm">projects.ts</h3>
                <p className="text-[#525252] text-xs font-mono">/src/data/projects.ts</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => copyToClipboard(generated.projects, 'projects')}
                  className="px-3 py-1 text-xs font-mono border border-[#262626] text-[#A3A3A3] hover:text-white hover:border-[#2563EB] transition-colors"
                >
                  {copied === 'projects' ? 'Copied!' : 'Copy'}
                </button>
                <button
                  onClick={() => downloadFile(generated.projects, 'projects.ts')}
                  className="px-3 py-1 text-xs font-mono border border-[#262626] text-[#A3A3A3] hover:text-white hover:border-[#2563EB] transition-colors"
                >
                  Download
                </button>
              </div>
            </div>
            <pre className="p-4 text-xs text-[#737373] font-mono overflow-x-auto max-h-80 overflow-y-auto">
              {generated.projects}
            </pre>
          </div>

          {/* Experience */}
          <div className="bg-[#0A0A0A] border border-[#262626]">
            <div className="flex items-center justify-between p-4 border-b border-[#262626]">
              <div>
                <h3 className="text-white font-mono text-sm">timeline.ts</h3>
                <p className="text-[#525252] text-xs font-mono">/src/data/timeline.ts</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => copyToClipboard(generated.experience, 'experience')}
                  className="px-3 py-1 text-xs font-mono border border-[#262626] text-[#A3A3A3] hover:text-white hover:border-[#2563EB] transition-colors"
                >
                  {copied === 'experience' ? 'Copied!' : 'Copy'}
                </button>
                <button
                  onClick={() => downloadFile(generated.experience, 'timeline.ts')}
                  className="px-3 py-1 text-xs font-mono border border-[#262626] text-[#A3A3A3] hover:text-white hover:border-[#2563EB] transition-colors"
                >
                  Download
                </button>
              </div>
            </div>
            <pre className="p-4 text-xs text-[#737373] font-mono overflow-x-auto max-h-80 overflow-y-auto">
              {generated.experience}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublishContent;
