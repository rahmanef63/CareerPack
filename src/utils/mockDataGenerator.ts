import type { 
  User, CVData, Application, 
  ChecklistItem, InterviewSession, ChatSession 
} from '@/types';

// Generate random Indonesian names
const firstNames = [
  'Budi', 'Ahmad', 'Siti', 'Dewi', 'Agus', 'Rini', 'Eko', 'Lina', 'Hendra', 'Maya',
  'Fajar', 'Nina', 'Bayu', 'Rina', 'Dodi', 'Wulan', 'Indra', 'Sari', 'Yusuf', 'Ani',
  'Adi', 'Putri', 'Rudi', 'Dian', 'Hadi', 'Rina', 'Joko', 'Fitri', 'Doni', 'Intan'
];

const lastNames = [
  'Santoso', 'Wijaya', 'Kusuma', 'Pratama', 'Sari', 'Hidayat', 'Nugroho', 'Lestari',
  'Saputra', 'Setiawan', 'Wati', 'Susanto', 'Rahayu', 'Purnama', 'Utama', 'Suryadi',
  'Anggraini', 'Hartono', 'Wulandari', 'Simanjuntak', 'Rajagukguk', 'Siregar', 'Nasution'
];

const companies = [
  'Tokopedia', 'Gojek', 'Shopee', 'Bukalapak', 'Traveloka', 'OVO', 'Dana', 'LinkAja',
  'Grab Indonesia', 'Lazada', 'Blibli', 'JD.ID', 'Zalora', 'Ruangguru', 'Zenius',
  'Halodoc', 'Kredivo', 'Akulaku', 'Pegadaian Digital', 'Mandiri', 'BCA', 'BNI', 'BRI'
];

const positions = [
  'Software Engineer', 'Product Manager', 'Data Analyst', 'UI/UX Designer', 'Marketing Manager',
  'Sales Executive', 'HR Specialist', 'Finance Analyst', 'Content Writer', 'Digital Marketing',
  'Project Manager', 'Customer Service', 'Graphic Designer', 'Video Editor', 'Account Manager'
];

const universities = [
  'Universitas Indonesia', 'ITB', 'UGM', 'Universitas Brawijaya', 'Universitas Padjadjaran',
  'BINUS', 'Prasetiya Mulya', 'Trisakti', 'Atma Jaya', 'Pelita Harapan',
  'Telkom University', 'Gunadarma', 'Bakrie University', 'Paramadina', 'President University'
];

const skills = [
  'JavaScript', 'Python', 'React', 'Node.js', 'SQL', 'Figma', 'Adobe Photoshop',
  'Digital Marketing', 'SEO', 'Content Writing', 'Project Management', 'Data Analysis',
  'Microsoft Excel', 'PowerPoint', 'Public Speaking', 'Negotiation', 'Leadership'
];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(start: Date, end: Date): string {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString().split('T')[0];
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

export function generateMockUsers(count: number): User[] {
  return Array.from({ length: count }, (_, i) => {
    const firstName = randomItem(firstNames);
    const lastName = randomItem(lastNames);
    return {
      id: generateId(),
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@email.com`,
      name: `${firstName} ${lastName}`,
      role: Math.random() > 0.9 ? 'admin' : 'user',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${firstName}${lastName}${i}`,
      createdAt: randomDate(new Date(2023, 0, 1), new Date()),
      lastLogin: randomDate(new Date(2024, 0, 1), new Date()),
      isActive: Math.random() > 0.1,
    };
  });
}

export function generateMockCV(userId: string): CVData {
  const firstName = randomItem(firstNames);
  const lastName = randomItem(lastNames);
  const hasExperience = Math.random() > 0.3;
  
  return {
    profile: {
      id: userId,
      name: `${firstName} ${lastName}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@email.com`,
      phone: `+62 8${Math.floor(Math.random() * 1000000000).toString().padStart(9, '0')}`,
      location: randomItem(['Jakarta', 'Bandung', 'Surabaya', 'Yogyakarta', 'Bali']),
      linkedin: `linkedin.com/in/${firstName.toLowerCase()}-${lastName.toLowerCase()}`,
      portfolio: '',
      summary: `Profesional berpengalaman di bidang ${randomItem(positions)} dengan keahlian dalam ${randomItem(skills)} dan ${randomItem(skills)}. Memiliki track record dalam memberikan hasil berkualitas tinggi.`,
      targetIndustry: randomItem(['Teknologi', 'Keuangan', 'Pemasaran', 'Konsultan']),
      experienceLevel: randomItem(['fresh-graduate', 'entry-level', 'mid-level', 'senior']),
    },
    education: [
      {
        id: generateId(),
        institution: randomItem(universities),
        degree: randomItem(['Sarjana', 'Magister', 'Diploma']),
        fieldOfStudy: randomItem(['Teknik Informatika', 'Manajemen', 'Akuntansi', 'Desain Komunikasi Visual', 'Psikologi']),
        startDate: randomDate(new Date(2015, 0, 1), new Date(2019, 0, 1)),
        endDate: randomDate(new Date(2019, 0, 1), new Date(2023, 0, 1)),
        gpa: (3 + Math.random()).toFixed(2),
      },
    ],
    experience: hasExperience ? Array.from({ length: Math.floor(Math.random() * 3) + 1 }, () => ({
      id: generateId(),
      company: randomItem(companies),
      position: randomItem(positions),
      startDate: randomDate(new Date(2019, 0, 1), new Date(2022, 0, 1)),
      endDate: Math.random() > 0.3 ? randomDate(new Date(2022, 0, 1), new Date()) : '',
      description: `Bertanggung jawab atas ${randomItem(['pengembangan produk', 'manajemen tim', 'analisis data', 'strategi marketing'])}. Berhasil meningkatkan ${randomItem(['efisiensi', 'penjualan', 'engagement'])} sebesar ${Math.floor(Math.random() * 50 + 10)}%.`,
      achievements: ['Mendapat penghargaan karyawan terbaik', 'Menyelesaikan proyek ahead of schedule'],
    })) : [],
    skills: Array.from({ length: Math.floor(Math.random() * 5) + 3 }, () => ({
      id: generateId(),
      name: randomItem(skills),
      category: randomItem(['technical', 'soft', 'language', 'tool']),
      proficiency: Math.floor(Math.random() * 3) + 3 as 1 | 2 | 3 | 4 | 5,
    })),
    certifications: Math.random() > 0.5 ? [
      {
        id: generateId(),
        name: randomItem(['Google Analytics', 'AWS Cloud Practitioner', 'Scrum Master', 'Digital Marketing']),
        issuer: randomItem(['Google', 'Amazon', 'Scrum Alliance', 'HubSpot']),
        date: randomDate(new Date(2021, 0, 1), new Date()),
      },
    ] : [],
    projects: Math.random() > 0.6 ? [
      {
        id: generateId(),
        name: `Proyek ${randomItem(['E-commerce', 'Dashboard', 'Mobile App', 'Website', 'Sistem'])}`,
        description: `Mengembangkan ${randomItem(['platform digital', 'aplikasi mobile', 'sistem manajemen'])} dengan fitur utama meliputi ${randomItem(['payment gateway', 'real-time analytics', 'user management'])}.`,
        technologies: [randomItem(skills), randomItem(skills)],
        link: '',
      },
    ] : [],
  };
}

export function generateMockApplications(count: number): Application[] {
  return Array.from({ length: count }, () => ({
    id: generateId(),
    company: randomItem(companies),
    position: randomItem(positions),
    status: randomItem(['applied', 'screening', 'interview', 'offer', 'rejected']),
    appliedDate: randomDate(new Date(2024, 0, 1), new Date()),
    lastUpdate: randomDate(new Date(2024, 0, 1), new Date()),
    notes: Math.random() > 0.7 ? 'Follow up dalam seminggu' : '',
  }));
}

export function generateMockChecklist(): ChecklistItem[] {
  const baseItems = [
    { id: 'doc-1', title: 'KTP', category: 'local' as const, subcategory: 'identity' as const, required: true },
    { id: 'doc-2', title: 'NPWP', category: 'local' as const, subcategory: 'identity' as const, required: true },
    { id: 'doc-3', title: 'Ijazah & Transkrip', category: 'local' as const, subcategory: 'education' as const, required: true },
    { id: 'doc-4', title: 'SKCK', category: 'local' as const, subcategory: 'identity' as const, required: true },
    { id: 'doc-5', title: 'BPJS', category: 'local' as const, subcategory: 'health' as const, required: true },
    { id: 'doc-10', title: 'Paspor', category: 'international' as const, subcategory: 'travel' as const, required: true },
    { id: 'doc-11', title: 'IELTS/TOEFL', category: 'international' as const, subcategory: 'professional' as const, required: true },
  ];
  
  return baseItems.map(item => ({
    ...item,
    description: `Dokumen ${item.title}`,
    completed: Math.random() > 0.5,
    dueDate: Math.random() > 0.7 ? randomDate(new Date(), new Date(2024, 11, 31)) : undefined,
    notes: '',
  }));
}

export function generateMockInterviewSessions(count: number): InterviewSession[] {
  return Array.from({ length: count }, () => ({
    id: generateId(),
    date: randomDate(new Date(2024, 0, 1), new Date()),
    category: randomItem(['behavioral', 'technical', 'situational']),
    questions: [],
    score: Math.floor(Math.random() * 30) + 70,
    feedback: 'Perlu meningkatkan komunikasi dan persiapan teknis',
  }));
}

export function generateMockChatSessions(count: number): ChatSession[] {
  return Array.from({ length: count }, (_, i) => ({
    id: generateId(),
    title: `Sesi Chat ${i + 1}`,
    messages: [
      {
        id: generateId(),
        role: 'user',
        content: 'Bantu saya membuat CV',
        timestamp: randomDate(new Date(2024, 0, 1), new Date()),
      },
      {
        id: generateId(),
        role: 'assistant',
        content: 'Tentu! Saya bisa membantu Anda membuat CV yang menarik...',
        timestamp: randomDate(new Date(2024, 0, 1), new Date()),
      },
    ],
    createdAt: randomDate(new Date(2024, 0, 1), new Date()),
    updatedAt: new Date().toISOString(),
  }));
}

// Main function to generate all mock data
export interface GeneratedMockData {
  users: User[];
  cvs: Record<string, CVData>;
  applications: Record<string, Application[]>;
  checklists: Record<string, ChecklistItem[]>;
  interviewSessions: Record<string, InterviewSession[]>;
  chatSessions: Record<string, ChatSession[]>;
}

export function generateAllMockData(userCount: number = 10): GeneratedMockData {
  const users = generateMockUsers(userCount);
  const cvs: Record<string, CVData> = {};
  const applications: Record<string, Application[]> = {};
  const checklists: Record<string, ChecklistItem[]> = {};
  const interviewSessions: Record<string, InterviewSession[]> = {};
  const chatSessions: Record<string, ChatSession[]> = {};

  users.forEach(user => {
    cvs[user.id] = generateMockCV(user.id);
    applications[user.id] = generateMockApplications(Math.floor(Math.random() * 5) + 1);
    checklists[user.id] = generateMockChecklist();
    interviewSessions[user.id] = generateMockInterviewSessions(Math.floor(Math.random() * 3));
    chatSessions[user.id] = generateMockChatSessions(Math.floor(Math.random() * 3));
  });

  return {
    users,
    cvs,
    applications,
    checklists,
    interviewSessions,
    chatSessions,
  };
}
