import Layout from '../components/Layout';
import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';

export default function AITransformationPage() {
  const [currentPhase, setCurrentPhase] = useState(1);
  const [companyData, setCompanyData] = useState({});
  const [interviews, setInterviews] = useState([]);
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(false);

  const phases = [
    { id: 1, name: 'Education & Alignment', status: 'current' },
    { id: 2, name: 'Identification & Auditing', status: 'pending' },
    { id: 3, name: 'Roadmap Generation', status: 'pending' }
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              AI Transformation Automation
            </h1>
            <p className="text-xl text-gray-600">
              Morningside Method - Phase 1 & 2 Automation
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between items-center">
              {phases.map((phase, index) => (
                <div key={phase.id} className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold
                    ${currentPhase >= phase.id ? 'bg-blue-600' : 'bg-gray-300'}`}>
                    {phase.id}
                  </div>
                  <span className="ml-2 text-sm font-medium">{phase.name}</span>
                  {index < phases.length - 1 && (
                    <div className={`w-20 h-1 mx-4 
                      ${currentPhase > phase.id ? 'bg-blue-600' : 'bg-gray-300'}`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Phase Content */}
          <motion.div
            key={currentPhase}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-lg shadow-lg p-8"
          >
            {currentPhase === 1 && <Phase1Component 
              onComplete={(data) => {
                setCompanyData(data);
                setCurrentPhase(2);
              }}
              loading={loading}
              setLoading={setLoading}
            />}
            
            {currentPhase === 2 && <Phase2Component 
              companyData={companyData}
              onComplete={(interviewData) => {
                setInterviews(interviewData);
                setCurrentPhase(3);
              }}
              loading={loading}
              setLoading={setLoading}
            />}
            
            {currentPhase === 3 && <Phase3Component 
              companyData={companyData}
              interviews={interviews}
              roadmap={roadmap}
              setRoadmap={setRoadmap}
              loading={loading}
              setLoading={setLoading}
            />}
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}

// Phase 1: Education & Alignment
function Phase1Component({ onComplete, loading, setLoading }) {
  const [formData, setFormData] = useState({
    name: '',
    industry: '',
    size: '',
    techLevel: '',
    currentChallenges: '',
    aiExperience: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch('/api/phase1/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyInfo: formData })
      });
      
      const result = await response.json();
      onComplete({ ...formData, ...result });
    } catch (error) {
      alert('Error starting Phase 1: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Phase 1: Education & Alignment</h2>
      <p className="text-gray-600 mb-6">
        First, we need to understand your business and create a customized AI education plan for your leadership team.
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">Company Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full p-3 border rounded-lg"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Industry</label>
            <select
              value={formData.industry}
              onChange={(e) => setFormData({...formData, industry: e.target.value})}
              className="w-full p-3 border rounded-lg"
              required
            >
              <option value="">Select Industry</option>
              <option value="Technology">Technology</option>
              <option value="Healthcare">Healthcare</option>
              <option value="Finance">Finance</option>
              <option value="Manufacturing">Manufacturing</option>
              <option value="Retail">Retail</option>
              <option value="Other">Other</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Company Size</label>
            <select
              value={formData.size}
              onChange={(e) => setFormData({...formData, size: e.target.value})}
              className="w-full p-3 border rounded-lg"
              required
            >
              <option value="">Select Size</option>
              <option value="1-10">1-10 employees</option>
              <option value="11-50">11-50 employees</option>
              <option value="51-200">51-200 employees</option>
              <option value="201-1000">201-1000 employees</option>
              <option value="1000+">1000+ employees</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Current Tech Level</label>
            <select
              value={formData.techLevel}
              onChange={(e) => setFormData({...formData, techLevel: e.target.value})}
              className="w-full p-3 border rounded-lg"
              required
            >
              <option value="">Select Level</option>
              <option value="basic">Basic (Email, Office)</option>
              <option value="intermediate">Intermediate (CRM, Cloud)</option>
              <option value="advanced">Advanced (APIs, Automation)</option>
            </select>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Current Business Challenges</label>
          <textarea
            value={formData.currentChallenges}
            onChange={(e) => setFormData({...formData, currentChallenges: e.target.value})}
            className="w-full p-3 border rounded-lg h-24"
            placeholder="What are your biggest operational challenges?"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">AI Experience</label>
          <textarea
            value={formData.aiExperience}
            onChange={(e) => setFormData({...formData, aiExperience: e.target.value})}
            className="w-full p-3 border rounded-lg h-24"
            placeholder="Any previous AI/automation experience?"
          />
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Generating Education Plan...' : 'Start AI Education & Alignment'}
        </button>
      </form>
    </div>
  );
}

// Phase 2: Identification & Auditing  
function Phase2Component({ companyData, onComplete, loading, setLoading }) {
  const [currentRole, setCurrentRole] = useState('');
  const [interviewData, setInterviewData] = useState({});
  const [completedInterviews, setCompletedInterviews] = useState([]);

  const roles = [
    'CEO/Executive', 'Operations Manager', 'Sales Manager', 
    'Marketing Manager', 'Customer Service', 'Finance/Accounting',
    'HR Manager', 'IT Manager', 'Frontline Staff'
  ];

  const handleInterviewSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch('/api/phase2/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: companyData.companyId,
          role: currentRole,
          answers: interviewData
        })
      });
      
      const result = await response.json();
      setCompletedInterviews([...completedInterviews, { role: currentRole, ...result }]);
      setCurrentRole('');
      setInterviewData({});
    } catch (error) {
      alert('Error processing interview: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Phase 2: Identification & Auditing</h2>
      <p className="text-gray-600 mb-6">
        Now we&apos;ll conduct interviews with key roles to map your business processes and identify AI opportunities.
      </p>
      
      {/* Completed Interviews */}
      {completedInterviews.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold mb-3">Completed Interviews ({completedInterviews.length})</h3>
          <div className="flex flex-wrap gap-2">
            {completedInterviews.map((interview, index) => (
              <span key={index} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                ✓ {interview.role}
              </span>
            ))}
          </div>
        </div>
      )}
      
      {/* Role Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Select Role to Interview</label>
        <select
          value={currentRole}
          onChange={(e) => setCurrentRole(e.target.value)}
          className="w-full p-3 border rounded-lg"
        >
          <option value="">Choose a role...</option>
          {roles.filter(role => !completedInterviews.find(i => i.role === role)).map(role => (
            <option key={role} value={role}>{role}</option>
          ))}
        </select>
      </div>
      
      {/* Interview Form */}
      {currentRole && (
        <form onSubmit={handleInterviewSubmit} className="space-y-6">
          <h3 className="text-lg font-semibold">Interview: {currentRole}</h3>
          
          <div>
            <label className="block text-sm font-medium mb-2">Daily Tasks & Responsibilities</label>
            <textarea
              value={interviewData.dailyTasks || ''}
              onChange={(e) => setInterviewData({...interviewData, dailyTasks: e.target.value})}
              className="w-full p-3 border rounded-lg h-24"
              placeholder="Describe typical daily tasks and responsibilities..."
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Current Pain Points & Frustrations</label>
            <textarea
              value={interviewData.painPoints || ''}
              onChange={(e) => setInterviewData({...interviewData, painPoints: e.target.value})}
              className="w-full p-3 border rounded-lg h-24"
              placeholder="What slows you down or causes frustration?"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Manual/Repetitive Processes</label>
            <textarea
              value={interviewData.manualProcesses || ''}
              onChange={(e) => setInterviewData({...interviewData, manualProcesses: e.target.value})}
              className="w-full p-3 border rounded-lg h-24"
              placeholder="What tasks do you do manually that could be automated?"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Time Spent on Key Activities</label>
            <textarea
              value={interviewData.timeBreakdown || ''}
              onChange={(e) => setInterviewData({...interviewData, timeBreakdown: e.target.value})}
              className="w-full p-3 border rounded-lg h-24"
              placeholder="How much time do you spend on different activities? (e.g., Data entry: 2hrs/day)"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Systems & Tools Used</label>
            <textarea
              value={interviewData.systemsUsed || ''}
              onChange={(e) => setInterviewData({...interviewData, systemsUsed: e.target.value})}
              className="w-full p-3 border rounded-lg h-24"
              placeholder="What software, systems, or tools do you use daily?"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Processing Interview...' : 'Submit Interview'}
          </button>
        </form>
      )}
      
      {/* Continue to Roadmap */}
      {completedInterviews.length >= 3 && (
        <div className="mt-8 p-4 bg-green-50 rounded-lg">
          <p className="text-green-800 mb-4">
            Great! You&apos;ve completed {completedInterviews.length} interviews. Ready to generate your AI Strategy Roadmap?
          </p>
          <button
            onClick={() => onComplete(completedInterviews)}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
          >
            Generate AI Strategy Roadmap
          </button>
        </div>
      )}
    </div>
  );
}

// Phase 3: Roadmap Generation
function Phase3Component({ companyData, interviews, roadmap, setRoadmap, loading, setLoading }) {
  
  const generateRoadmap = useCallback(async () => {
    setLoading(true);

    try {
      const response = await fetch(`/api/phase2/roadmap/${companyData.companyId}`);
      const result = await response.json();
      setRoadmap(result);
    } catch (error) {
      alert('Error generating roadmap: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [companyData.companyId]);

  useEffect(() => {
    if (!roadmap) {
      generateRoadmap();
    }
  }, [roadmap, generateRoadmap]);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-lg">Generating your comprehensive AI Strategy Roadmap...</p>
        <p className="text-sm text-gray-600">This may take 2-3 minutes</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">AI Strategy Roadmap Generated</h2>
      
      {roadmap && (
        <div className="space-y-6">
          {/* Executive Summary */}
          <div className="bg-blue-50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-4">Executive Summary</h3>
            <p className="text-gray-700">{roadmap.executiveSummary}</p>
          </div>
          
          {/* Quick Wins */}
          <div className="bg-green-50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-4">Quick Wins (0-6 months)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {roadmap.quickWins?.map((win, index) => (
                <div key={index} className="bg-white p-4 rounded border">
                  <h4 className="font-medium">{win.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">{win.description}</p>
                  <div className="mt-2 flex justify-between text-xs">
                    <span className="text-green-600">ROI: {win.roi}</span>
                    <span className="text-blue-600">Timeline: {win.timeline}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Implementation Timeline */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-4">Implementation Timeline</h3>
            <div className="space-y-4">
              {roadmap.timeline?.map((phase, index) => (
                <div key={index} className="flex items-center space-x-4">
                  <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <span className="font-medium">{phase.phase}</span>
                      <span className="text-sm text-gray-600">{phase.duration}</span>
                    </div>
                    <p className="text-sm text-gray-600">{phase.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* ROI Projections */}
          <div className="bg-yellow-50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-4">ROI Projections</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600">{roadmap.roi?.year1}</div>
                <div className="text-sm text-gray-600">Year 1 ROI</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">{roadmap.roi?.timeSavings}</div>
                <div className="text-sm text-gray-600">Time Savings</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">{roadmap.roi?.costReduction}</div>
                <div className="text-sm text-gray-600">Cost Reduction</div>
              </div>
            </div>
          </div>
          
          {/* Download Options */}
          <div className="flex space-x-4">
            <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
              Download Full Roadmap (PDF)
            </button>
            <button className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700">
              Export to PowerPoint
            </button>
            <button className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700">
              Schedule Implementation Call
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
