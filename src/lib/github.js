const GITHUB_USERNAME = 'aparnap2';
const GITHUB_API_URL = 'https://api.github.com';

export async function getTopRepositories(count = 5) {
  try {
    const response = await fetch(
      `${GITHUB_API_URL}/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=${count}&type=owner`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          ...(process.env.GITHUB_TOKEN && {
            'Authorization': `token ${process.env.GITHUB_TOKEN}`
          })
        },
        next: { revalidate: 3600 } // Cache for 1 hour
      }
    );

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const repos = await response.json();
    
    return repos
      .filter(repo => !repo.fork && !repo.archived)
      .map(repo => ({
        id: repo.id,
        title: repo.name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        description: repo.description || 'No description available',
        category: getRepoCategory(repo),
        problem: generateProblemStatement(repo),
        solution: generateSolutionStatement(repo),
        features: generateFeatures(repo),
        stack: extractTechStack(repo),
        idealClient: generateIdealClient(repo),
        url: repo.html_url,
        stars: repo.stargazers_count,
        language: repo.language,
        updated: repo.updated_at
      }))
      .slice(0, count);
  } catch (error) {
    console.error('Error fetching GitHub repos:', error);
    return [];
  }
}

function getRepoCategory(repo) {
  const name = repo.name.toLowerCase();
  const description = (repo.description || '').toLowerCase();
  
  if (name.includes('chatbot') || name.includes('ai') || description.includes('ai')) return 'AI Automation';
  if (name.includes('web') || name.includes('site') || repo.language === 'JavaScript') return 'Web Development';
  if (name.includes('api') || description.includes('api')) return 'API Development';
  if (name.includes('automation') || description.includes('automation')) return 'Automation';
  if (name.includes('data') || description.includes('data')) return 'Data Processing';
  return 'Software Development';
}

function generateProblemStatement(repo) {
  const category = getRepoCategory(repo);
  const templates = {
    'AI Automation': 'Businesses struggle with repetitive tasks and manual processes that consume valuable time.',
    'Web Development': 'Companies need modern, responsive websites that engage users and drive conversions.',
    'API Development': 'Organizations require reliable APIs to connect systems and automate data flow.',
    'Automation': 'Manual workflows create bottlenecks and reduce operational efficiency.',
    'Data Processing': 'Businesses have difficulty extracting insights from large amounts of data.',
    'Software Development': 'Custom software solutions are needed to solve specific business challenges.'
  };
  return templates[category] || 'Businesses face unique challenges that require custom software solutions.';
}

function generateSolutionStatement(repo) {
  const description = repo.description || '';
  if (description) {
    return `Built a custom solution: ${description}`;
  }
  
  const category = getRepoCategory(repo);
  const templates = {
    'AI Automation': 'Developed an AI-powered automation system to streamline operations.',
    'Web Development': 'Created a modern, responsive web application with optimal user experience.',
    'API Development': 'Built a robust API system for seamless data integration.',
    'Automation': 'Implemented automated workflows to eliminate manual processes.',
    'Data Processing': 'Developed data processing tools for efficient analysis and insights.',
    'Software Development': 'Created custom software tailored to specific business requirements.'
  };
  return templates[category] || 'Developed a custom software solution to address the specific needs.';
}

function generateFeatures(repo) {
  const category = getRepoCategory(repo);
  const language = repo.language;
  
  const baseFeatures = {
    'AI Automation': [
      'Intelligent task automation',
      'Machine learning integration',
      'Real-time processing',
      'Custom AI workflows'
    ],
    'Web Development': [
      'Responsive design',
      'Modern UI/UX',
      'Cross-browser compatibility',
      'Performance optimization'
    ],
    'API Development': [
      'RESTful API design',
      'Authentication & security',
      'Rate limiting',
      'Comprehensive documentation'
    ],
    'Automation': [
      'Workflow automation',
      'Error handling',
      'Monitoring & logging',
      'Scalable architecture'
    ],
    'Data Processing': [
      'Data validation',
      'Batch processing',
      'Real-time analytics',
      'Export capabilities'
    ]
  };
  
  const features = baseFeatures[category] || [
    'Clean code architecture',
    'Error handling',
    'Documentation',
    'Testing coverage'
  ];
  
  // Add language-specific feature
  if (language) {
    features.push(`Built with ${language}`);
  }
  
  return features.slice(0, 4);
}

function extractTechStack(repo) {
  const stack = [];
  
  if (repo.language) {
    stack.push(repo.language);
  }
  
  const name = repo.name.toLowerCase();
  const description = (repo.description || '').toLowerCase();
  
  // Common tech stack detection
  if (name.includes('react') || description.includes('react')) stack.push('React');
  if (name.includes('next') || description.includes('nextjs')) stack.push('Next.js');
  if (name.includes('node') || description.includes('nodejs')) stack.push('Node.js');
  if (name.includes('python')) stack.push('Python');
  if (name.includes('api')) stack.push('REST API');
  if (name.includes('ai') || description.includes('ai')) stack.push('AI/ML');
  if (name.includes('database') || description.includes('db')) stack.push('Database');
  
  return [...new Set(stack)].slice(0, 5);
}

function generateIdealClient(repo) {
  const category = getRepoCategory(repo);
  const templates = {
    'AI Automation': 'Small to medium businesses looking to automate repetitive tasks and improve efficiency.',
    'Web Development': 'Companies needing modern web presence with focus on user experience and conversions.',
    'API Development': 'Organizations requiring system integration and automated data workflows.',
    'Automation': 'Businesses with manual processes that want to increase operational efficiency.',
    'Data Processing': 'Companies with large datasets needing analysis and reporting capabilities.',
    'Software Development': 'Organizations requiring custom software solutions for specific business needs.'
  };
  return templates[category] || 'Businesses seeking custom software solutions to solve specific challenges.';
}