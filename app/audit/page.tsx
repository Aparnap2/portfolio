import { AuditChatbot } from "@/components/audit/AuditChatbot";

export default function AuditPage() {
  return (
    <div className="min-h-screen bg-black py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
              AI Opportunity Assessment
            </h1>
            <p className="text-neutral-400 mt-4 text-lg">
              Discover automation opportunities that could save your clients time and money
            </p>
          </div>
          
          <AuditChatbot />
        </div>
      </div>
    </div>
  );
}