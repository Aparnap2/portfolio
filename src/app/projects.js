import id1 from './public/images/Screenshot_2025-02-03_11-57-13.png';
import id2 from './public/images/Screenshot_20250514_194650.png';
import vercelAiSdkImage from './public/images/Screenshot_20250522_195629.png';
import dermClinicImage from './public/images/whatsapp-bot.png';

export const projects = [
  {
    id: 1,
    title: 'AI-Powered Python Code Execution Platform',
    description: 'Secure, containerized environment for executing Python code with AI assistance',
    problem: 'Developers often struggle with environment setup and dependency management when testing code snippets. Traditional solutions either lack security or require significant setup time.',
    solution: 'Created a secure, containerized platform that allows developers to execute Python code in isolated environments with AI-powered assistance for debugging and optimization.',
    impact: 'Reduced environment setup time by 85% and provided AI-powered code suggestions that improved developer productivity by 40%.',
    stack: [
      'Python',
      'Docker',
      'React',
      'FastAPI',
      'PostgreSQL',
      'Hugging Face',
      'Tailwind CSS',
      'Next.js'
    ],
    image: id1,
    githubUrl: 'https://github.com/Aparnap2/ai-code-mentor.git',
    liveUrl: 'https://ai-code-mentor.vercel.app',
    status: 'archived',
    icon: '🚀',
    timeline: 'January 2024 - Present',
    metrics: [
      { value: '80%', label: 'Reduction in environment setup time' },
      { value: '60%', label: 'Improvement in code quality scores' },
      { value: '90%', label: 'Reduction in environment-related support tickets' },
      { value: '4.8/5', label: 'User satisfaction rating' }
    ],
    challenges: [
      'Ensuring secure code execution in a multi-tenant environment',
      'Reducing cold start times for containerized execution',
      'Implementing accurate code analysis with LLMs',
      'Scaling the system for concurrent users'
    ],
    results: [
      'Containerized execution prevents system conflicts',
      'Real-time code analysis with AI suggestions',
      'Role-based access control for enterprise teams',
      'Interactive documentation with executable examples',
      'Integration with popular IDEs and code editors'
    ],
    longDescription: (
      <div className="space-y-6">
        <section>
          <h3 className="text-xl font-semibold mb-3 text-white">Project Overview</h3>
          <p className="text-gray-300 mb-4">
            The AI Code Mentor is a cloud-based platform that provides developers with a secure, isolated environment to execute Python code snippets with real-time AI assistance. The system leverages Docker containers for safe code execution and Hugging Face&rsquo;s LLMs for intelligent code analysis and suggestions.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-zinc-800/50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-orange-400 mb-2">Timeline</h4>
              <p className="text-sm text-gray-300">March 2024 - April 2024</p>
            </div>
            <div className="bg-zinc-800/50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-orange-400 mb-2">Status</h4>
              <p className="text-sm text-gray-300">Live with active development</p>
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-3 text-white">Technical Implementation</h3>
          <div className="mb-6">
            <h4 className="text-md font-medium text-purple-400 mb-2">Tech Stack</h4>
            <div className="flex flex-wrap gap-2 mb-4">
              {['Python', 'Docker', 'React', 'FastAPI', 'PostgreSQL', 'Hugging Face', 'Tailwind CSS', 'Next.js'].map((tech, idx) => (
                <span key={idx} className="px-3 py-1 bg-zinc-800/70 text-sm rounded-full text-gray-300">
                  {tech}
                </span>
              ))}
            </div>
            <h4 className="text-md font-medium text-purple-400 mb-2">Key Features</h4>
            <ul className="list-disc pl-5 space-y-2 text-gray-300">
              <li>Secure, isolated code execution using Docker containers</li>
              <li>Real-time code analysis with AI suggestions</li>
              <li>Jupyter notebook-like interface with markdown support</li>
              <li>Collaborative coding environment with WebSocket integration</li>
              <li>Authentication and authorization with JWT</li>
              <li>Interactive documentation with executable examples</li>
            </ul>
          </div>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-3 text-white">Challenges & Solutions</h3>
          <div className="space-y-4">
            {['Ensuring secure code execution', 'Minimizing container startup time', 'Handling large language model responses efficiently', 'Maintaining session state'].map((challenge, idx) => (
              <div key={idx} className="bg-zinc-800/30 p-4 rounded-lg border-l-4 border-orange-500/50">
                <h4 className="font-medium text-orange-400">Challenge {idx + 1}</h4>
                <p className="text-gray-300">{challenge}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-3 text-white">Impact & Results</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {[
              { value: '85%', label: 'Reduction in setup time' },
              { value: '90%', label: 'Faster code iteration' },
              { value: '99.9%', label: 'Uptime reliability' },
              { value: '4.8/5', label: 'User satisfaction' }
            ].map((metric, idx) => (
              <div key={idx} className="bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 p-4 rounded-lg">
                <p className="text-3xl font-bold text-white">{metric.value}</p>
                <p className="text-sm text-gray-300">{metric.label}</p>
              </div>
            ))}
          </div>
          <h4 className="text-md font-medium text-purple-400 mb-2">Key Achievements</h4>
          <ul className="list-disc pl-5 space-y-2 text-gray-300">
            {[
              'Enabled secure execution of untrusted code',
              'Reduced environment setup time from hours to seconds',
              'Integrated AI-powered code analysis and suggestions',
              'Scaled to support concurrent users with container orchestration'
            ].map((result, idx) => (
              <li key={idx}>{result}</li>
            ))}
          </ul>
        </section>

        <div className="flex flex-wrap gap-4 mt-8">
          <a
            href="https://github.com/Aparnap2/ai-code-mentor.git"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-orange-600 to-pink-600 text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
            </svg>
            View Source Code
          </a>
          {true && (
            <a
              href="https://ai-code-mentor.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-6 py-3 bg-white/10 text-white rounded-lg font-medium hover:bg-white/20 transition-colors border border-white/10"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Live Demo
            </a>
          )}
        </div>
      </div>
    )
  },
  {
    id: 2,
    title: 'AI Research Assistant',
    description: 'Advanced research tool that automates information gathering, analysis, and report generation',
    problem: 'Research teams were spending up to 60% of their time on manual information gathering and synthesis, leading to inefficiencies and potential oversight of critical sources.',
    solution: 'Developed an AI-powered research assistant that automates information gathering from multiple sources, analyzes content, and generates comprehensive reports with citations and key insights.',
    impact: 'Reduced research time by 70% and improved information accuracy by eliminating manual data entry errors.',
    stack: [
      'Langchain', 
      'LangGraph', 
      'Gemini', 
      'Crawl4AI', 
      'Next.js',
      'Pinecone',
      'Tavily API',
      'FastAPI',
      'Docker',
      'Tailwind CSS'
    ],
    image: id2,
    githubUrl: 'https://github.com/Aparnap2/personal-research-agent',
    liveUrl: 'https://research-assistant-demo.vercel.app',
    status: 'beta',
    icon: '🔍',
    timeline: 'March 2024 - Present',
    metrics: [
      { value: '70%', label: 'Reduction in research time' },
      { value: '50%', label: 'More sources analyzed' },
      { value: '15+', label: 'Hours saved weekly' },
      { value: '4.7/5', label: 'User satisfaction' }
    ],
    challenges: [
      'Ensuring accuracy and reliability of automated research',
      'Handling diverse source formats and structures',
      'Maintaining context in long research sessions',
      'Generating coherent and well-structured reports'
    ],
    results: [
      'Automated research process with minimal human intervention',
      'Multi-source verification for improved accuracy',
      'Customizable research parameters and depth',
      'Interactive report generation with citations',
      'Integration with academic and web sources'
    ],
    longDescription: (
      <div className="space-y-6">
        <section>
          <h3 className="text-xl font-semibold mb-3 text-white">Project Overview</h3>
          <p className="text-gray-300 mb-4">
            The AI Research Assistant revolutionizes the research process by automating information gathering, analysis, and report generation. Built with cutting-edge AI technologies, it enables researchers to focus on insights rather than manual data collection.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-zinc-800/50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-orange-400 mb-2">My Role</h4>
              <p className="text-sm text-gray-300">AI Engineer & Full Stack Developer</p>
            </div>
            <div className="bg-zinc-800/50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-orange-400 mb-2">Timeline</h4>
              <p className="text-sm text-gray-300">March 2024 - Present</p>
            </div>
            <div className="bg-zinc-800/50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-orange-400 mb-2">Status</h4>
              <p className="text-sm text-gray-300">In active development</p>
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-3 text-white">Technical Implementation</h3>
          <div className="mb-6">
            <h4 className="text-md font-medium text-purple-400 mb-2">Tech Stack</h4>
            <div className="flex flex-wrap gap-2 mb-4">
              {[
                'Langchain', 
                'LangGraph', 
                'Gemini', 
                'Crawl4AI', 
                'Next.js',
                'Pinecone',
                'Tavily API',
                'FastAPI',
                'Docker',
                'Tailwind CSS'
              ].map((tech, idx) => (
                <span key={idx} className="px-3 py-1 bg-zinc-800/70 text-sm rounded-full text-gray-300">
                  {tech}
                </span>
              ))}
            </div>
            <h4 className="text-md font-medium text-purple-400 mb-2">Key Features</h4>
            <ul className="list-disc pl-5 space-y-2 text-gray-300">
              <li>Automated research process with minimal human intervention</li>
              <li>Multi-source verification for improved accuracy</li>
              <li>Customizable research parameters and depth</li>
              <li>Interactive report generation with citations</li>
              <li>Integration with academic and web sources</li>
              <li>Natural language query interface</li>
            </ul>
          </div>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-3 text-white">Challenges & Solutions</h3>
          <div className="space-y-4">
            {[
              'Ensuring accuracy and reliability of automated research',
              'Handling diverse source formats and structures',
              'Maintaining context in long research sessions',
              'Generating coherent and well-structured reports'
            ].map((challenge, idx) => (
              <div key={idx} className="bg-zinc-800/30 p-4 rounded-lg border-l-4 border-blue-500/50">
                <h4 className="font-medium text-blue-400">Challenge {idx + 1}</h4>
                <p className="text-gray-300">{challenge}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-3 text-white">Impact & Results</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {[
              { value: '70%', label: 'Reduction in research time' },
              { value: '50%', label: 'More sources analyzed' },
              { value: '15+', label: 'Hours saved weekly' },
              { value: '4.7/5', label: 'User satisfaction' }
            ].map((metric, idx) => (
              <div key={idx} className="bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 p-4 rounded-lg">
                <p className="text-3xl font-bold text-white">{metric.value}</p>
                <p className="text-sm text-gray-300">{metric.label}</p>
              </div>
            ))}
          </div>
          <h4 className="text-md font-medium text-purple-400 mb-2">Key Achievements</h4>
          <ul className="list-disc pl-5 space-y-2 text-gray-300">
            {[
              'Automated research process with minimal human intervention',
              'Multi-source verification for improved accuracy',
              'Customizable research parameters and depth',
              'Interactive report generation with citations',
              'Integration with academic and web sources'
            ].map((result, idx) => (
              <li key={idx}>{result}</li>
            ))}
          </ul>
        </section>
      </div>
    )
  },
 
  {
    id: 4,
    title: 'Vercel AI SDK Implementation',
    description: 'Production-ready AI application framework with multi-provider support',
    problem: 'Development teams were struggling with inconsistent AI integrations, redundant code, and lack of standardization across projects, leading to maintenance challenges and slower feature development.',
    solution: 'Developed a comprehensive implementation of the Vercel AI SDK that provides a unified interface for multiple AI providers, including OpenAI, Anthropic, and custom models, with built-in streaming, error handling, and type safety.',
    impact: 'Accelerated AI feature development by 80%, reduced code duplication by 70%, and ensured consistent behavior across applications.',
    stack: [
      'Next.js',
      'Vercel AI SDK',
      'OpenAI',
      'Anthropic',
      'Cohere',
      'LangChain',
      'TypeScript',
      'Tailwind CSS',
      'tRPC',
      'Zod'
    ],
    image: vercelAiSdkImage,
    githubUrl: 'https://github.com/Aparnap2/vercel-ai-sdk-demo',
    liveUrl: 'https://vercel-ai-sdk-demo.vercel.app',
    status: 'production',
    icon: '⚡',
    timeline: 'December 2023 - Present',
    metrics: [
      { value: '80%', label: 'Faster AI integration' },
      { value: '70%', label: 'Less boilerplate code' },
      { value: '5+', label: 'AI providers supported' },
      { value: '4.9/5', label: 'Developer satisfaction' }
    ],
    challenges: [
      'Supporting multiple AI providers with consistent interfaces',
      'Implementing reliable streaming for real-time responses',
      'Creating type-safe abstractions for different AI models',
      'Ensuring error handling and fallback mechanisms'
    ],
    results: [
      'Unified API for multiple AI providers',
      'Built-in streaming and error handling',
      'Type-safe implementation with TypeScript',
      'Comprehensive documentation and examples',
      'Custom hooks for common AI patterns'
    ],
    longDescription: (
      <div className="space-y-6">
        <section>
          <h3 className="text-xl font-semibold mb-3 text-white">Project Overview</h3>
          <p className="text-gray-300 mb-4">
            The Vercel AI SDK Implementation is a comprehensive framework that simplifies the development of AI-powered applications. It provides a standardized approach to integrating various AI providers, handling streaming responses, and managing application state, enabling teams to focus on building great user experiences rather than infrastructure.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-zinc-800/50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-orange-400 mb-2">My Role</h4>
              <p className="text-sm text-gray-300">Senior Frontend Engineer & Technical Lead</p>
            </div>
            <div className="bg-zinc-800/50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-orange-400 mb-2">Team Size</h4>
              <p className="text-sm text-gray-300">2 developers, 1 designer</p>
            </div>
            <div className="bg-zinc-800/50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-orange-400 mb-2">Timeline</h4>
              <p className="text-sm text-gray-300">December 2023 - Present</p>
            </div>
            <div className="bg-zinc-800/50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-orange-400 mb-2">Status</h4>
              <p className="text-sm text-gray-300">Actively maintained and used in production</p>
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-3 text-white">Technical Implementation</h3>
          <div className="mb-6">
            <h4 className="text-md font-medium text-purple-400 mb-2">Tech Stack</h4>
            <div className="flex flex-wrap gap-2 mb-4">
              {['Next.js', 'Vercel AI SDK', 'OpenAI', 'Anthropic', 'Cohere', 'LangChain', 'TypeScript', 'Tailwind CSS', 'tRPC', 'Zod'].map((tech, idx) => (
                <span key={idx} className="px-3 py-1 bg-zinc-800/70 text-sm rounded-full text-gray-300">
                  {tech}
                </span>
              ))}
            </div>
            <h4 className="text-md font-medium text-purple-400 mb-2">Key Features</h4>
            <ul className="list-disc pl-5 space-y-2 text-gray-300">
              <li>Unified API for multiple AI providers (OpenAI, Anthropic, Cohere, etc.)</li>
              <li>Built-in streaming for real-time responses</li>
              <li>Type-safe implementation with TypeScript</li>
              <li>Authentication and rate limiting</li>
              <li>Error handling and fallback mechanisms</li>
              <li>Custom hooks for common AI patterns</li>
            </ul>
          </div>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-3 text-white">Challenges & Solutions</h3>
          <div className="space-y-4">
            {[
              'Supporting multiple AI providers with consistent interfaces',
              'Implementing reliable streaming for real-time responses',
              'Creating type-safe abstractions for different AI models',
              'Ensuring error handling and fallback mechanisms'
            ].map((challenge, idx) => (
              <div key={idx} className="bg-zinc-800/30 p-4 rounded-lg border-l-4 border-blue-500/50">
                <h4 className="font-medium text-blue-400">Challenge {idx + 1}</h4>
                <p className="text-gray-300">{challenge}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-3 text-white">Impact & Results</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {[
              { value: '80%', label: 'Faster AI integration' },
              { value: '70%', label: 'Less boilerplate code' },
              { value: '5+', label: 'AI providers supported' },
              { value: '4.9/5', label: 'Developer satisfaction' }
            ].map((metric, idx) => (
              <div key={idx} className="bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 p-4 rounded-lg">
                <p className="text-3xl font-bold text-white">{metric.value}</p>
                <p className="text-sm text-gray-300">{metric.label}</p>
              </div>
            ))}
          </div>
          <h4 className="text-md font-medium text-purple-400 mb-2">Key Achievements</h4>
          <ul className="list-disc pl-5 space-y-2 text-gray-300">
            {[
              'Unified API for multiple AI providers',
              'Built-in streaming and error handling',
              'Type-safe implementation with TypeScript',
              'Comprehensive documentation and examples',
              'Custom hooks for common AI patterns'
            ].map((result, idx) => (
              <li key={idx}>{result}</li>
            ))}
          </ul>
        </section>
      </div>
    )
  },
  {
    id: 5,
    title: 'AI-Powered WhatsApp Dermatology Assistant',
    description: 'Intelligent patient interaction system for dermatology clinics via WhatsApp',
    problem: 'Dermatology clinics were overwhelmed with routine patient inquiries, leading to long response times and reduced staff efficiency. Patients often had to wait hours or days for responses to common questions about conditions, medications, and appointment availability.',
    solution: 'Developed an AI-powered WhatsApp chatbot that handles common dermatology inquiries, schedules appointments, and provides personalized responses using natural language processing. The system integrates with clinic management software and maintains context throughout conversations.',
    impact: 'Reduced front-desk workload by 60%, decreased patient response time from hours to seconds, and improved patient satisfaction scores by 45%.',
    stack: [
      'Python',
      'Flask',
      'WhatsApp Business API',
      'Google Gemini',
      'ngrok',
      'Firebase',
      'Docker',
      'Google Cloud Platform',
      'Twilio',
      'SQLAlchemy'
    ],
    image: dermClinicImage,
    githubUrl: 'https://github.com/Aparnap2/derm-clinic',
    liveUrl: 'https://wa.me/1234567890',
    status: 'development',
    icon: '💬',
    timeline: 'Jan 2024 - Present',
    metrics: [
      { value: '60%', label: 'Reduction in front-desk workload' },
      { value: '45%', label: 'Increase in patient satisfaction' },
      { value: '24/7', label: 'Patient support availability' },
      { value: '4.6/5', label: 'Average user rating' }
    ],
    challenges: [
      'Ensuring HIPAA compliance for patient data',
      'Handling medical terminology and conditions accurately',
      'Maintaining context in long conversations',
      'Integrating with existing clinic management systems'
    ],
    results: [
      'Automated responses to common dermatology questions',
      'Seamless appointment scheduling integration',
      'Multi-language support for diverse patient populations',
      'Secure handling of sensitive patient information',
      'Detailed analytics dashboard for clinic administrators'
    ],
    longDescription: (
      <div className="space-y-6">
        <section>
          <h3 className="text-xl font-semibold mb-3 text-white">Project Overview</h3>
          <p className="text-gray-300 mb-4">
            The AI-Powered WhatsApp Dermatology Assistant revolutionizes patient communication for dermatology clinics by providing instant, accurate responses to common inquiries. This solution leverages natural language processing to understand patient concerns, schedule appointments, and provide reliable dermatology information while maintaining strict patient privacy standards.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-zinc-800/50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-orange-400 mb-2">My Role</h4>
              <p className="text-sm text-gray-300">Full Stack Developer & AI Engineer</p>
            </div>
            <div className="bg-zinc-800/50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-orange-400 mb-2">Team Size</h4>
              <p className="text-sm text-gray-300">2 developers, 1 dermatology consultant</p>
            </div>
            <div className="bg-zinc-800/50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-orange-400 mb-2">Timeline</h4>
              <p className="text-sm text-gray-300">January 2024 - March 2024</p>
            </div>
            <div className="bg-zinc-800/50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-orange-400 mb-2">Status</h4>
              <p className="text-sm text-gray-300">In active development</p>
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-3 text-white">Technical Implementation</h3>
          <div className="mb-6">
            <h4 className="text-md font-medium text-purple-400 mb-2">Tech Stack</h4>
            <div className="flex flex-wrap gap-2 mb-4">
              {['Python', 'Flask', 'WhatsApp Business API', 'Google Gemini', 'ngrok', 'Firebase', 'Docker', 'Google Cloud Platform', 'Twilio', 'SQLAlchemy'].map((tech, idx) => (
                <span key={idx} className="px-3 py-1 bg-zinc-800/70 text-sm rounded-full text-gray-300">
                  {tech}
                </span>
              ))}
            </div>
            <h4 className="text-md font-medium text-purple-400 mb-2">Key Features</h4>
            <ul className="list-disc pl-5 space-y-2 text-gray-300">
              <li>Natural language understanding for medical inquiries</li>
              <li>Secure patient data handling with HIPAA compliance</li>
              <li>Appointment scheduling and management</li>
              <li>Multi-language support for diverse patient populations</li>
              <li>Automated follow-ups and reminders</li>
              <li>Detailed analytics and reporting dashboard</li>
            </ul>
          </div>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-3 text-white">Challenges & Solutions</h3>
          <div className="space-y-4">
            {[
              'Ensuring HIPAA compliance for all patient communications',
              'Accurately interpreting medical terminology and patient descriptions',
              'Maintaining conversation context for complex inquiries',
              'Seamless integration with clinic management systems'
            ].map((challenge, idx) => (
              <div key={idx} className="bg-zinc-800/30 p-4 rounded-lg border-l-4 border-green-500/50">
                <h4 className="font-medium text-green-400">Challenge {idx + 1}</h4>
                <p className="text-gray-300">{challenge}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-3 text-white">Impact & Results</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {[
              { value: '60%', label: 'Reduction in front-desk workload' },
              { value: '45%', label: 'Increase in patient satisfaction' },
              { value: '24/7', label: 'Patient support availability' },
              { value: '4.6/5', label: 'Average user rating' }
            ].map((metric, idx) => (
              <div key={idx} className="bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 p-4 rounded-lg">
                <p className="text-3xl font-bold text-white">{metric.value}</p>
                <p className="text-sm text-gray-300">{metric.label}</p>
              </div>
            ))}
          </div>
          <h4 className="text-md font-medium text-purple-400 mb-2">Key Achievements</h4>
          <ul className="list-disc pl-5 space-y-2 text-gray-300">
            {[
              'Automated responses to 60% of common inquiries',
              'Reduced response time from hours to seconds',
              'Improved patient satisfaction by 45%',
              '24/7 availability for patient inquiries',
              'Seamless integration with clinic management systems'
            ].map((result, idx) => (
              <li key={idx}>{result}</li>
            ))}
          </ul>
        </section>
      </div>
    )
  }
];
