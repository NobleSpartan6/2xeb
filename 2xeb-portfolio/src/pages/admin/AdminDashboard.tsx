import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

interface Stats {
  projects: number;
  experience: number;
  caseStudies: number;
  contactMessages: number;
}

interface RecentAudit {
  id: string;
  action: string;
  table_name: string;
  record_id: string;
  created_at: string;
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats>({ projects: 0, experience: 0, caseStudies: 0, contactMessages: 0 });
  const [recentAudit, setRecentAudit] = useState<RecentAudit[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch counts in parallel
        const [projectsRes, experienceRes, caseStudiesRes, contactRes, auditRes] = await Promise.all([
          supabase.from('projects').select('id', { count: 'exact', head: true }),
          supabase.from('experience').select('id', { count: 'exact', head: true }),
          supabase.from('case_studies').select('id', { count: 'exact', head: true }),
          supabase.from('contact_messages').select('id', { count: 'exact', head: true }),
          supabase.from('audit_log').select('*').order('created_at', { ascending: false }).limit(5),
        ]);

        setStats({
          projects: projectsRes.count ?? 0,
          experience: experienceRes.count ?? 0,
          caseStudies: caseStudiesRes.count ?? 0,
          contactMessages: contactRes.count ?? 0,
        });

        if (auditRes.data) {
          setRecentAudit(auditRes.data as RecentAudit[]);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const statCards = [
    { label: 'Projects', value: stats.projects, path: '/admin/projects', color: '#2563EB' },
    { label: 'Experience', value: stats.experience, path: '/admin/experience', color: '#06B6D4' },
    { label: 'Case Studies', value: stats.caseStudies, path: '/admin/case-studies', color: '#84CC16' },
    { label: 'Contact Messages', value: stats.contactMessages, path: '#', color: '#F59E0B' },
  ];

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'text-green-400';
      case 'UPDATE':
        return 'text-yellow-400';
      case 'DELETE':
        return 'text-red-400';
      default:
        return 'text-[#737373]';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse">
          <div className="w-8 h-8 bg-[#0A0A0A] border border-[#262626] grid place-items-center">
            <span className="text-[#2563EB] font-bold text-sm font-space-grotesk">EB</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-space-grotesk font-bold text-white mb-2">Dashboard</h1>
        <p className="text-sm text-[#737373] font-mono">
          Manage your portfolio content
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat) => (
          <Link
            key={stat.label}
            to={stat.path}
            className="group p-6 bg-[#0A0A0A] border border-[#262626] hover:border-[#2563EB]/50 transition-colors"
          >
            <div className="flex items-center justify-between mb-4">
              <span
                className="text-[10px] uppercase tracking-widest font-mono"
                style={{ color: stat.color }}
              >
                {stat.label}
              </span>
              <svg
                className="w-4 h-4 text-[#525252] group-hover:text-[#2563EB] transition-colors"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <div className="text-3xl font-space-grotesk font-bold text-white">
              {stat.value}
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="p-6 bg-[#0A0A0A] border border-[#262626]">
          <h2 className="text-lg font-space-grotesk font-semibold text-white mb-4">
            Quick Actions
          </h2>
          <div className="space-y-3">
            <Link
              to="/admin/projects"
              className="flex items-center gap-3 p-3 bg-[#050505] border border-[#1f2937] hover:border-[#2563EB]/50 transition-colors"
            >
              <div className="w-8 h-8 bg-[#2563EB]/10 grid place-items-center">
                <svg className="w-4 h-4 text-[#2563EB]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <span className="text-sm font-mono text-[#a3a3a3]">Add New Project</span>
            </Link>
            <Link
              to="/admin/experience"
              className="flex items-center gap-3 p-3 bg-[#050505] border border-[#1f2937] hover:border-[#2563EB]/50 transition-colors"
            >
              <div className="w-8 h-8 bg-[#06B6D4]/10 grid place-items-center">
                <svg className="w-4 h-4 text-[#06B6D4]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <span className="text-sm font-mono text-[#a3a3a3]">Add Experience</span>
            </Link>
            <Link
              to="/admin/pages"
              className="flex items-center gap-3 p-3 bg-[#050505] border border-[#1f2937] hover:border-[#2563EB]/50 transition-colors"
            >
              <div className="w-8 h-8 bg-[#84CC16]/10 grid place-items-center">
                <svg className="w-4 h-4 text-[#84CC16]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <span className="text-sm font-mono text-[#a3a3a3]">Edit Page Content</span>
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="p-6 bg-[#0A0A0A] border border-[#262626]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-space-grotesk font-semibold text-white">
              Recent Activity
            </h2>
            <Link
              to="/admin/audit"
              className="text-xs font-mono text-[#525252] hover:text-[#2563EB] transition-colors"
            >
              View All &rarr;
            </Link>
          </div>
          {recentAudit.length === 0 ? (
            <p className="text-sm text-[#525252] font-mono">No activity yet</p>
          ) : (
            <div className="space-y-3">
              {recentAudit.map((audit) => (
                <div
                  key={audit.id}
                  className="flex items-center justify-between py-2 border-b border-[#1f2937] last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-mono ${getActionColor(audit.action)}`}>
                      {audit.action}
                    </span>
                    <span className="text-sm font-mono text-[#a3a3a3]">
                      {audit.table_name}
                    </span>
                  </div>
                  <span className="text-xs text-[#525252] font-mono">
                    {formatDate(audit.created_at)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Security Notice */}
      <div className="p-4 bg-[#2563EB]/5 border border-[#2563EB]/20">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-[#2563EB] mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <div>
            <h3 className="text-sm font-space-grotesk font-semibold text-white mb-1">
              Security Enabled
            </h3>
            <p className="text-xs text-[#737373] font-mono">
              All content changes are logged. Row Level Security (RLS) protects your data.
              Only authenticated admins can modify content.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
