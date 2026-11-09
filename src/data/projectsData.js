export const initialProjects = [
  {
    id: 'proj-1',
    name: 'Customer 360 & Unified Identity Graph',
    description: 'Consolidating multi-channel user identities, CRM records, and telemetry into an omni-channel customer graph for real-time personalization.',
    objective: 'Unify 14 disconnected customer data silos across sales, support, and web into a single sub-second graph query endpoint.',
    businessContext: 'Supports Enterprise ARR retention and expansion goals for FY26 by reducing customer churn prediction latency from 24h to real-time.',
    status: 'In Progress',
    progress: 74,
    pinned: true,
    recommended: true,
    category: 'Data Infrastructure',
    tags: ['GraphDB', 'Identity', 'Snowflake', 'Vector Store'],
    accessLevel: 'Editor',
    lastUpdated: '12 mins ago',
    stakeholders: [
      { name: 'Sarah Chen', role: 'Project Owner', email: 'sarah.c@ingenworks.com', avatar: 'SC', lead: true },
      { name: 'David Miller', role: 'Co-Owner (Data Lead)', email: 'david.m@ingenworks.com', avatar: 'DM' },
      { name: 'Srivatsav Damaraju', role: 'Contributor (AI Integrations)', email: 'srivatsav@ingenworks.com', avatar: 'SD' },
      { name: 'Elena Rostova', role: 'Security & Governance', email: 'elena.r@ingenworks.com', avatar: 'ER' }
    ],
    journal: [
      {
        id: 'j-1',
        title: 'Snowflake Identity Stitching Pipeline Deployed',
        author: 'David Miller',
        role: 'Data Lead',
        timestamp: 'Today, 11:30 AM',
        content: 'Deployed CDC webhook listeners for Salesforce lead conversions. Graph node synthesis is running at 18ms latency with zero dropped frames.'
      },
      {
        id: 'j-2',
        title: 'Weekly Executive Stakeholder Review',
        author: 'Sarah Chen',
        role: 'Project Owner',
        timestamp: 'Yesterday, 3:45 PM',
        content: 'Reviewed Q4 latency milestones with VP of Engineering. Approved expanding vector embeddings to customer support chat transcripts.'
      },
      {
        id: 'j-3',
        title: 'SOC2 & HIPAA Compliance Approval Granted',
        author: 'Elena Rostova',
        role: 'Security & Governance',
        timestamp: 'Nov 2, 2026',
        content: 'Passed zero-trust identity verification audit. Encrypted transit and token redaction rules active.'
      }
    ],
    qaDatabase: [
      {
        question: 'What is the main objective of this project?',
        answer: 'To unify 14 disconnected customer data silos into an omni-channel identity graph with sub-second query latency.'
      },
      {
        question: 'Who is the project owner?',
        answer: 'Sarah Chen (sarah.c@ingenworks.com) is the designated Project Owner and lead.'
      },
      {
        question: 'What data technologies are being used?',
        answer: 'Snowflake data warehouse, GraphDB identity resolution, CDC webhooks, and Vector Store embeddings.'
      }
    ]
  },
  {
    id: 'proj-2',
    name: 'Autonomous Financial Reconciliation Bot',
    description: 'AI reasoning bot that ingests multi-currency Stripe, bank statements, and ERP invoices to reconcile ledgers with zero human intervention.',
    objective: 'Automate monthly and quarterly ledger balance closing from 8 business days down to 45 minutes.',
    businessContext: 'Critical finance automation initiative for reducing external auditing fees and speeding up board report readiness.',
    status: 'In Review',
    progress: 92,
    pinned: true,
    recommended: false,
    category: 'Finance & Operations',
    tags: ['Finance', 'Audit', 'Stripe', 'ERP', 'Reasoning'],
    accessLevel: 'Owner',
    lastUpdated: '1 hour ago',
    stakeholders: [
      { name: 'Marcus Vance', role: 'Project Owner', email: 'marcus.v@ingenworks.com', avatar: 'MV', lead: true },
      { name: 'Rachel Zane', role: 'Co-Owner (Treasury)', email: 'rachel.z@ingenworks.com', avatar: 'RZ' },
      { name: 'Srivatsav Damaraju', role: 'Contributor', email: 'srivatsav@ingenworks.com', avatar: 'SD' }
    ],
    journal: [
      {
        id: 'j-4',
        title: 'Final Audit Run: $48M Discrepancy Reconciliation Passed',
        author: 'Marcus Vance',
        role: 'Project Owner',
        timestamp: 'Today, 9:15 AM',
        content: 'Autonomous ledger comparison matched 48,200 foreign exchange transactions with 99.998% confidence score.'
      },
      {
        id: 'j-5',
        title: 'ERP SAP Connector Verified',
        author: 'Rachel Zane',
        role: 'Co-Owner',
        timestamp: 'Nov 3, 2026',
        content: 'Completed bidirectional staging authentication via OAuth 2.1 mTLS.'
      }
    ],
    qaDatabase: [
      {
        question: 'How fast does this bot reconcile balances?',
        answer: 'It reduces closing time from 8 business days to under 45 minutes with 99.998% match precision.'
      },
      {
        question: 'Who owns this project?',
        answer: 'Marcus Vance is the Project Owner with Rachel Zane leading Treasury coordination.'
      }
    ]
  },
  {
    id: 'proj-3',
    name: 'Autonomous Support Copilot & Triage Mesh',
    description: 'Real-time multi-agent customer support co-pilot that resolves tier-1 tickets, drafts responses, and auto-routes technical bugs to Jira.',
    objective: 'Resolve 65% of customer inquiries on first touch and drop average resolution time below 3 minutes.',
    businessContext: 'Direct customer retention initiative empowering tier-1 teams during hypergrowth expansion.',
    status: 'Active',
    progress: 81,
    pinned: false,
    recommended: true,
    category: 'Customer Intelligence',
    tags: ['Zendesk', 'Jira', 'Multi-Agent', 'NLP'],
    accessLevel: 'Viewer',
    lastUpdated: '3 hours ago',
    stakeholders: [
      { name: 'Amara Okafor', role: 'Project Owner', email: 'amara.o@ingenworks.com', avatar: 'AO', lead: true },
      { name: 'Kenji Sato', role: 'Engineering Lead', email: 'kenji.s@ingenworks.com', avatar: 'KS' }
    ],
    journal: [
      {
        id: 'j-6',
        title: 'Multi-Agent Routing Benchmark v2.4',
        author: 'Kenji Sato',
        role: 'Engineering Lead',
        timestamp: 'Nov 3, 2026',
        content: 'Semantic triage accuracy improved to 94.6% on 2,500 historical ticket samples.'
      }
    ],
    qaDatabase: [
      {
        question: 'What is the target resolution time?',
        answer: 'Under 3 minutes, with 65% of all tier-1 tickets resolved on first touch.'
      }
    ]
  },
  {
    id: 'proj-4',
    name: 'Real-Time Vector Pipeline & Semantic Cache',
    description: 'Low-latency distributed vector retrieval and semantic embedding cache layer reducing inference compute costs across all agents.',
    objective: 'Provide <12ms similarity search across 250M document embeddings while cutting recurring token costs by 40%.',
    businessContext: 'Core infrastructure for Ingen Optim performance guarantees and team cost control.',
    status: 'Planning',
    progress: 35,
    pinned: false,
    recommended: true,
    category: 'Infrastructure',
    tags: ['Embeddings', 'Cache', 'Cost-Optim', 'Rust'],
    accessLevel: 'Editor',
    lastUpdated: 'Yesterday',
    stakeholders: [
      { name: 'Liam Hughes', role: 'Project Owner', email: 'liam.h@ingenworks.com', avatar: 'LH', lead: true },
      { name: 'David Miller', role: 'Contributor', email: 'david.m@ingenworks.com', avatar: 'DM' }
    ],
    journal: [
      {
        id: 'j-7',
        title: 'Rust Microservice Prototype Benchmarks',
        author: 'Liam Hughes',
        role: 'Project Owner',
        timestamp: 'Nov 2, 2026',
        content: 'Achieved p99 latency of 9.2ms on cold cache lookup across 10M synthetic vectors.'
      }
    ],
    qaDatabase: [
      {
        question: 'What are the latency targets?',
        answer: 'Targeting sub-12ms similarity search across 250 million document embeddings.'
      }
    ]
  }
]
