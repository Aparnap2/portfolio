import id1 from './public/images/Screenshot_2025-02-03_11-57-13.png';
import id2 from './public/images/Screenshot_20250514_194650.png'
//import researchAssistantImage from './public/images/your-research-assistant-image.png'; // Replace with the actual path

export const projects = [
  {
    id: 1,
    title: 'AI-Powered Python Code Execution',
    description: 'A secure AI-driven Python execution platform using Hugging Face LLMs, Fastify, and Docker for isolated script execution.',
    imageUrl: id1,
    techStack: ['Fastify', 'Docker', 'Hugging Face', 'Next.js', 'Tailwind CSS'],
    link: 'https://github.com/Aparnap2/ai-code-mentor.git',
    longDescription: (
      <>
        <p>
          A secure platform designed for executing Python code snippets within isolated Docker containers. This project leverages Hugging Face's powerful Large Language Models to understand and potentially generate code, while Fastify provides a robust and efficient backend API. Docker ensures a secure and reproducible execution environment for each script.
        </p>
        <h3>Key Features:</h3>
        <ul>
          <li>Secure Python code execution in isolated Docker containers.</li>
          <li>Integration with Hugging Face LLMs for potential code understanding and assistance.</li>
          <li>Fastify backend for a performant API.</li>
          <li>Clear and user-friendly interface built with Next.js and styled with Tailwind CSS.</li>
        </ul>
        <h3>Technology Stack:</h3>
        <ul>
          <li><strong>Fastify:</strong> A fast and low-overhead web framework for Node.js.</li>
          <li><strong>Docker:</strong> Containerization platform for isolated environments.</li>
          <li><strong>Hugging Face Transformers:</strong> Library for working with pre-trained language models.</li>
          <li><strong>Next.js:</strong> React framework for building server-rendered and static web applications.</li>
          <li><strong>Tailwind CSS:</strong> Utility-first CSS framework for rapid styling.</li>
        </ul>
        <p>
          This project demonstrates the ability to create secure and scalable AI-powered tools for code execution and analysis.
        </p>
        <a href="https://github.com/Aparnap2/ai-code-mentor.git" target="_blank" rel="noopener noreferrer" className="text-accent1 hover:text-accent2 font-semibold">
          View on GitHub
        </a>
      </>
    ),
  },
  {
    id: 2,
    title: 'AI-Powered Deep Research Assistant',
    description: 'An intelligent personal research assistant leveraging Langchain, LangGraph, Gemini, and Crawl4AI for comprehensive information gathering and synthesis.',
    imageUrl: id2,// researchAssistantImage , 
    techStack: ['Langchain', 'LangGraph', 'Gemini', 'Crawl4AI'],
    link: 'https://github.com/Aparnap2/personal-research-agent', // You can set this to '#' or a specific link if needed
    longDescription: (
      <>
        <p>
          Driven by the need for efficient and in-depth information gathering, I developed a personal deep research assistant leveraging the power of Large Language Models and sophisticated orchestration frameworks. This project showcases my ability to integrate cutting-edge AI technologies like Gemini with Langchain and LangGraph to create an intelligent tool for comprehensive research and knowledge synthesis.
        </p>
        <p>
          The assistant addresses the time-consuming nature of in-depth research and the need for efficient information filtering and synthesis by automating key steps in the research process.
        </p>
        <h3>Key Features:</h3>
        <ul>
          <li>
            <strong>Intelligent Web Crawling:</strong> Utilizes Crawl4AI to efficiently extract relevant information from multiple web sources based on user queries.
          </li>
          <li>
            <strong>Advanced Information Processing:</strong> Leverages Langchain for sophisticated document loading, splitting, and embedding techniques.
          </li>
          <li>
            <strong>Orchestrated Reasoning:</strong> Employs LangGraph to create a structured flow for multi-step reasoning and information retrieval.
          </li>
          <li>
            <strong>Powerful Language Model:</strong> Integrated with Google's Gemini to generate insightful summaries, answer complex questions, and synthesize information from diverse sources.
          </li>
          <li>
            <strong>Retrieval Augmented Generation (RAG):</strong> Implements RAG to ground the language model's responses in the crawled data, ensuring accuracy and relevance.
          </li>
          <li>
            <strong>Contextual Awareness:</strong> Maintains context throughout the research process, allowing for follow-up questions and iterative exploration.
          </li>
          {/* Add any other unique features here */}
        </ul>
        <h3>Technology Stack:</h3>
        <ul>
          <li>
            <strong>Langchain:</strong> A powerful framework for building LLM-powered applications, providing modularity and flexibility in creating complex workflows.
          </li>
          <li>
            <strong>LangGraph:</strong> Extends Langchain to enable the creation of cyclical and stateful chains, crucial for orchestrating multi-agent interactions and complex reasoning.
          </li>
          <li>
            <strong>Gemini:</strong> Google's state-of-the-art multimodal model, chosen for its strong performance in understanding and generating text, as well as its ability to process information effectively.
          </li>
          <li>
            <strong>Crawl4AI:</strong> An efficient web crawling tool specifically designed for AI applications, enabling targeted data extraction.
          </li>
          {/* Add any other relevant technologies */}
        </ul>
        {/* You can add more details here if needed */}
      </>
    ),
  },
  // Add more projects as needed
];
