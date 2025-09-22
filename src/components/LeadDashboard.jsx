import { useState, useEffect } from 'react';

export default function LeadDashboard() {
  const [stats, setStats] = useState(null);
  const [leads, setLeads] = useState([]);
  const [newLead, setNewLead] = useState({
    firstName: '',
    lastName: '',
    email: '',
    company: ''
  });

  const [submissionStatus, setSubmissionStatus] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/dashboard');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const submitLead = async (e) => {
    e.preventDefault();
    setSubmissionStatus('Submitting...');
    try {
      const response = await fetch('http://localhost:3001/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLead)
      });
      const result = await response.json();
      
      if (result.success) {
        setSubmissionStatus(`Lead submitted! ID: ${result.leadId}`);
        setNewLead({ firstName: '', lastName: '', email: '', company: '' });
        fetchStats();
      } else {
        setSubmissionStatus('Failed to submit lead');
      }
    } catch (error) {
      setSubmissionStatus('Failed to submit lead');
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Lead Enrichment Dashboard</h1>
      
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-blue-100 p-4 rounded-lg">
            <h3 className="font-semibold">Total Leads</h3>
            <p className="text-2xl">{stats.totalLeads}</p>
          </div>
          <div className="bg-green-100 p-4 rounded-lg">
            <h3 className="font-semibold">Processed</h3>
            <p className="text-2xl">{stats.processedLeads}</p>
          </div>
          <div className="bg-purple-100 p-4 rounded-lg">
            <h3 className="font-semibold">Avg Score</h3>
            <p className="text-2xl">{stats.averageScore.toFixed(1)}</p>
          </div>
        </div>
      )}

      {/* Lead Form */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">Submit New Lead</h2>
        <form onSubmit={submitLead} className="grid grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="First Name"
            value={newLead.firstName}
            onChange={(e) => setNewLead({...newLead, firstName: e.target.value})}
            className="border p-2 rounded"
            required
          />
          <input
            type="text"
            placeholder="Last Name"
            value={newLead.lastName}
            onChange={(e) => setNewLead({...newLead, lastName: e.target.value})}
            className="border p-2 rounded"
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={newLead.email}
            onChange={(e) => setNewLead({...newLead, email: e.target.value})}
            className="border p-2 rounded"
            required
          />
          <input
            type="text"
            placeholder="Company"
            value={newLead.company}
            onChange={(e) => setNewLead({...newLead, company: e.target.value})}
            className="border p-2 rounded"
            required
          />
          <button
            type="submit"
            className="col-span-2 bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
          >
            Submit Lead
          </button>
        </form>
        {submissionStatus && (
          <p className="mt-4 text-center">{submissionStatus}</p>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-gray-100 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">System Status</h3>
        <p className="text-sm text-gray-600">
          Lead system running on port 3001. Submit leads above to see AI enrichment, scoring, and routing in action.
        </p>
      </div>
    </div>
  );
}
