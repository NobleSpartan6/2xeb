// Re-export all static data from a single entry point
export { PROJECTS, buildProjectContext } from './projects';
export { EXPERIENCE } from './timeline';
export { COLORS, GRAPH_DATA, generateGraph } from './graph';
export { CASE_STUDIES, getCaseStudyBySlug } from './caseStudies';
export type { CaseStudy, TimelineEvent } from './caseStudies';
export { SITE_INDEX } from './siteIndex';
export type { SitePage } from './siteIndex';


