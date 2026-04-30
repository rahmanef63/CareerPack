import type { RoadmapResource as Resource } from "../types";
import type { SimpleRoadmapNode } from "../types/builder";

const mkNode = (
  id: string, title: string, description: string,
  difficulty: 'beginner' | 'intermediate' | 'advanced',
  hours: number, prereqs: string[], resources: Resource[],
): SimpleRoadmapNode => ({
  id, title, description, difficulty,
  estimatedHours: hours, prerequisites: prereqs, resources,
});

/**
 * Hardcoded roadmap fallback. Used when DB templates aren't seeded yet
 * — keeps the page usable on a fresh install.
 */
export function generateFallbackNodes(categoryId: string): SimpleRoadmapNode[] {
  const roadmaps: Record<string, SimpleRoadmapNode[]> = {
    frontend: [
      mkNode('fe-1', 'HTML & CSS Dasar', 'Struktur web dan styling fundamental', 'beginner', 20, [], [
        { id: 'r1', title: 'HTML Dasar - Petani Kode', type: 'video', url: 'https://www.youtube.com/c/PetaniKode', free: true },
        { id: 'r2', title: 'CSS Fundamentals', type: 'article', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS', free: true },
      ]),
      mkNode('fe-2', 'JavaScript Fundamental', 'Logika pemrograman web', 'beginner', 40, ['fe-1'], [
        { id: 'r3', title: 'JavaScript Dasar - Web Programming UNPAS', type: 'video', url: 'https://www.youtube.com/c/WebProgrammingUNPAS', free: true },
        { id: 'r4', title: 'JavaScript.info', type: 'article', url: 'https://javascript.info', free: true },
      ]),
      mkNode('fe-3', 'React.js', 'Library UI modern dari Meta', 'intermediate', 50, ['fe-2'], [
        { id: 'r5', title: 'React Dokumentasi Resmi', type: 'article', url: 'https://react.dev', free: true },
      ]),
      mkNode('fe-4', 'State Management', 'Redux, Zustand, atau Context API', 'intermediate', 25, ['fe-3'], [
        { id: 'r7', title: 'Redux Toolkit Tutorial', type: 'video', url: 'https://redux-toolkit.js.org', free: true },
      ]),
      mkNode('fe-5', 'Next.js & SSR', 'Framework React dengan Server-Side Rendering', 'advanced', 35, ['fe-3'], [
        { id: 'r8', title: 'Next.js Dokumentasi', type: 'article', url: 'https://nextjs.org', free: true },
      ]),
    ],
    backend: [
      mkNode('be-1', 'Node.js Dasar', 'Runtime JavaScript untuk server', 'beginner', 30, [], [
        { id: 'r9', title: 'Node.js Docs', type: 'documentation', url: 'https://nodejs.org', free: true },
      ]),
      mkNode('be-2', 'Express.js', 'Framework web minimalis', 'beginner', 25, ['be-1'], [
        { id: 'r10', title: 'Express Tutorial', type: 'article', url: 'https://expressjs.com', free: true },
      ]),
      mkNode('be-3', 'Database SQL', 'MySQL, PostgreSQL fundamentals', 'intermediate', 35, ['be-2'], [
        { id: 'r11', title: 'SQL Tutorial - W3Schools', type: 'article', url: 'https://www.w3schools.com/sql', free: true },
      ]),
      mkNode('be-4', 'REST API Design', 'Best practices API development', 'intermediate', 20, ['be-3'], [
        { id: 'r13', title: 'REST API Design Guide', type: 'article', url: 'https://restfulapi.net', free: true },
      ]),
    ],
  };
  return roadmaps[categoryId] ?? roadmaps['frontend'];
}
