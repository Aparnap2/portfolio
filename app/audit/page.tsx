import { AuditChatbot } from "@/components/audit/AuditChatbot";

export default function AuditPage() {
  return (
    <div className="min-h-screen bg-black py-4 sm:py-8 lg:py-12">
      <div className="container mx-auto px-3 sm:px-4 lg:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-6 sm:mb-8 lg:mb-12">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
              AI Opportunity Assessment
            </h1>
            <p className="text-neutral-400 mt-2 sm:mt-4 text-sm sm:text-base lg:text-lg max-w-2xl mx-auto">
              Discover automation opportunities that could save your clients time and money
            </p>
          </div>
          
          <AuditChatbot />
        </div>
      </div>
    </div>
  );
}