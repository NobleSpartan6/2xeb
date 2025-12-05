import { ExperienceItem } from '../lib/types';

export const EXPERIENCE: ExperienceItem[] = [
  {
    id: 1,
    company: "JPMorganChase",
    role: "Software Engineer",
    date: "Aug 2024 - Present",
    location: "Jersey City, New Jersey",
    desc: "Full-time Software Engineer. Working on high-scale investment banking systems and modern web architecture.",
    type: 'SWE'
  },
  {
    id: 2,
    company: "JPMorganChase",
    role: "Software Engineering Intern",
    date: "Jun 2023 - Aug 2023",
    location: "Jersey City, New Jersey",
    desc: "Prime Finance Site Reliability Engineering. Automated testing of an API using an AWS Lambda function, instrumented test requests with OpenTelemetry, and visualized data via Grafana.",
    skills: ["Java", "AWS Lambda", "OpenTelemetry", "Spring Boot", "Grafana", "SQL"],
    type: 'SWE'
  },
  {
    id: 3,
    company: "Cornell FinTech Club",
    role: "Financial Software Engineer",
    date: "Mar 2022 - Mar 2024",
    location: "Ithaca, New York",
    desc: "Developed financial software and tools. Collaborated on projects involving quantitative analysis and web development.",
    skills: ["Python", "Django", "NumPy", "Pandas"],
    type: 'SWE'
  },
  {
    id: 4,
    company: "Underrepresented Minorities in Computing",
    role: "Member",
    date: "Sep 2020 - May 2024",
    location: "Ithaca, New York",
    desc: "Active member of the community supporting diversity in the tech industry.",
    type: 'OTHER'
  },
  {
    id: 5,
    company: "BlackGen Capital",
    role: "Quant Member",
    date: "Mar 2021 - Jan 2023",
    location: "Ithaca, New York",
    desc: "Developed algorithmic trading models and a foundation for technical fundamentals such as accounting, DCF Valuation, and equity research.",
    skills: ["Python", "QuantConnect", "NumPy", "Pandas"],
    type: 'ML'
  },
  {
    id: 6,
    company: "Jane Street",
    role: "FOCUS Participant",
    date: "Aug 2021",
    location: "Remote",
    desc: "Selected participant for the FOCUS program, learning OCaml and quantitative trading concepts.",
    skills: ["OCaml"],
    type: 'SWE'
  },
  {
    id: 7,
    company: "Str8 Rippin",
    role: "Video Editor",
    date: "Dec 2017 - Aug 2018",
    location: "Contract",
    desc: "Coordinated a multiple video editor project to be displayed during break periods in the 2018 Halo World Championships Twitch livestream with 100,000+ concurrent viewers.",
    skills: ["Adobe Creative Suite"],
    type: 'VIDEO'
  }
];
