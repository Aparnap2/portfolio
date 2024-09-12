import ChatbotContainer from "./component/chatbot/chatbot";
import {projects} from "./projects"

export default function Home() {
  return (
    <div className="bg-gradient-radial from-saffron to-black min-h-screen flex flex-col items-center text-white">
      {/* Header Section */}
      <header className="w-full max-w-5xl mx-auto px-4 py-8 text-center">
        <div className="flex flex-col items-center mb-8">
          <img src="/path/to/your/photo.jpg" alt="Aparna Pradhan" className="w-32 h-32 rounded-full object-cover mb-4 shadow-lg" />
          <h1 className="text-5xl font-bold mb-2">Aparna Pradhan</h1>
          <p className="text-xl mb-2">AI SaaS Developer</p>
          <p className="text-base mb-4">West Bengal, India</p>
          <button className="btn-saffron">Contact Me</button>
        </div>
      </header>
      {/* Projects Section */}
      <section className="w-full max-w-5xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-2 gap-8">
        {projects.map((project) => (
          <div
            key={project.id}
            className="glass rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300"
          >
            <img
              src={project.imageUrl}
              alt={project.title}
              className="w-full h-40 object-cover"
            />
            <div className="p-4">
              <h3 className="text-xl font-mono font-bold text-blue-950 mb-2">{project.title}</h3>
              <p className="text-sm text-gray-900 mb-4">{project.description}</p>
              <div className="flex flex-wrap gap-2">
                {project.techStack.map((tech) => (
                  <span
                    key={tech}
                    className="px-2 py-1 bg-gray-800 text-sm rounded-md"
                  >
                    {tech}
                  </span>
                ))}
              </div>
              <a
                href={project.link}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-saffron block mt-4"
              >
                View Project
              </a>
            </div>
          </div>
        ))}
      </section>
      {/* Contact Section */}
      <section className="mt-16">
        <h2 className="text-4xl font-bold mb-8 text-center">Contact Me</h2>
        <div className="glass p-6 rounded-lg shadow-lg">
          <form className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" placeholder="Your Name" className="w-full p-4 rounded-lg glass border border-white text-white focus:outline-none focus:ring-2 focus:ring-saffron" />
              <input type="email" placeholder="Your Email" className="w-full p-4 rounded-lg glass border border-white text-white focus:outline-none focus:ring-2 focus:ring-saffron" />
            </div>
            <textarea placeholder="Your Message" className="w-full p-4 rounded-lg glass border border-white text-white focus:outline-none focus:ring-2 focus:ring-saffron h-36" />
            <button className="btn-saffron w-full mt-4">Send Message</button>
          </form>
        </div>
      </section>
      <ChatbotContainer />
      {/* Footer */}
      <footer className="py-8 text-center">
        <p>&copy; 2024 Aparna Pradhan. All rights reserved.</p>
      </footer>
    </div>
  );
}