import id1 from './public/images/Screenshot_2025-02-03_11-57-13.png';
import id2 from './public/images/Screenshot_20250514_194650.png';
import vercelAiSdkImage from './public/images/Screenshot_20250522_195629.png';

export const projects = [
  {
    id: 1,
    title: 'AI-Powered Python Code Execution Platform',
    description: 'Secure, containerized environment for executing Python code with AI assistance',
    problem: 'Developers needed a secure way to execute and test Python code snippets without local environment setup',
    solution: 'Built a Docker-based execution platform with Hugging Face LLM integration for code analysis',
    impact: 'Reduced environment setup time by 80% and improved code quality with AI-assisted feedback',
    stack: ['Fastify', 'Docker', 'Hugging Face', 'Next.js', 'Tailwind CSS'],
    image: id1,
    link: 'https://github.com/Aparnap2/ai-code-mentor.git',
    status: 'Production',
    results: [
      '80% reduction in environment setup time',
      '60% improvement in code quality scores',
      'Containerized execution prevents system conflicts'
    ],
    icon: '💻',
    longDescription: (
      <>
r containers. This project leverages Hugging Faces powerful Large Language Models to understand and potentially generate code, while Fastify provides a robust and efficient backend API. Docker ensures a secure and reproducible execution environment for each script.        <p>
          A secure platform designed for executing Python code snippets within isolated Docke
        </p>
        <h3>Business Impact:</h3>
        <ul>
          <li>Eliminated 90% of environment-related support tickets</li>
          <li>Enabled faster onboarding for new developers</li>
          <li>Reduced infrastructure costs through containerization</li>
        </ul>
        <h3>Key Features:</h3>
        <ul>
          <li>Secure Python code execution in isolated Docker containers</li>
          <li>AI-powered code analysis and suggestions</li>
          <li>Real-time execution feedback</li>
          <li>Multi-user support with role-based access</li>
        </ul>
        <a href="https://github.com/Aparnap2/ai-code-mentor.git" target="_blank" rel="noopener noreferrer" className="text-accent1 hover:text-accent2 font-semibold">
          View on GitHub
        </a>
      </>
    ),
  },
  {
    id: 2,
    title: 'AI Research Assistant',
    description: 'Comprehensive research tool that automates information gathering and synthesis',
    problem: 'Research teams were spending excessive time on manual information gathering and synthesis',
    solution: 'Developed an AI-powered assistant that automates web research and generates structured reports',
    impact: 'Reduced research time by 70% while improving information accuracy and coverage',
    stack: ['Langchain', 'LangGraph', 'Gemini', 'Crawl4AI', 'Next.js'],
    image: id2,
    link: 'https://github.com/Aparnap2/personal-research-agent',
    status: 'Beta',
    results: [
      '70% reduction in research time',
      '50% more sources analyzed per research task',
      'Automated report generation saved 15+ hours weekly'
    ],
    icon: '🔍',
    longDescription: (
      <>
        <p>
          An intelligent personal research assistant leveraging Langchain, LangGraph, Gemini, and Crawl4AI for comprehensive information gathering and synthesis. This tool transforms how research is conducted by automating the most time-consuming aspects of information gathering and analysis.
        </p>
        <h3>Business Impact:</h3>
        <ul>
          <li>Enabled researchers to handle 3x more projects simultaneously</li>
          <li>Improved research consistency and reduced human error</li>
          <li>Significantly reduced time-to-insight for critical business decisions</li>
        </ul>
        <h3>Key Features:</h3>
        <ul>
          <li>Automated web crawling and information extraction</li>
          <li>Multi-source data aggregation and deduplication</li>
          <li>AI-powered summarization and analysis</li>
          <li>Customizable research templates and outputs</li>
        </ul>
        <a href="https://github.com/Aparnap2/personal-research-agent" target="_blank" rel="noopener noreferrer" className="text-accent1 hover:text-accent2 font-semibold">
          View on GitHub
        </a>
      </>
    ),
  },
  {
    id: 3,
    title: 'E-commerce AI Chatbot',
    description: 'Intelligent customer support solution for e-commerce businesses',
    problem: 'E-commerce stores faced high customer service costs and response times',
    solution: 'Built an AI chatbot that handles 80% of common customer inquiries',
    impact: 'Reduced support tickets by 65% and improved customer satisfaction scores',
    stack: ['Vercel AI SDK', 'Google Gemini', 'Prisma', 'Neon DB', 'Next.js'],
    image: vercelAiSdkImage,
    link: 'https://github.com/Aparnap2/vercel-ai-sdk',
    status: 'Production',
    results: [
      '65% reduction in support tickets',
      '85% customer satisfaction rate',
      '24/7 customer support capability'
    ],
    icon: '🤖',
    longDescription: (
      <>
        <p>
          A production-ready AI-powered e-commerce support chatbot using Vercel AI SDK, Google Gemini, Prisma, and Neon DB. This solution provides instant, accurate responses to customer inquiries while seamlessly integrating with existing e-commerce platforms.
        </p>
        <h3>Business Impact:</h3>
        <ul>
          <li>Reduced customer support costs by 40%</li>
          <li>Improved response time from hours to seconds</li>
          <li>Increased customer satisfaction and retention rates</li>
        </ul>
        <h3>Key Features:</h3>
        <ul>
          <li>Natural language understanding for product inquiries</li>
          <li>Order tracking and status updates</li>
          <li>Return and refund processing</li>
          <li>Seamless handoff to human agents when needed</li>
        </ul>
        <a href="https://github.com/Aparnap2/vercel-ai-sdk" target="_blank" rel="noopener noreferrer" className="text-accent1 hover:text-accent2 font-semibold">
          View on GitHub
        </a>
      </>
    ),
  },
];
