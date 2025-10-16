import { Inbox } from 'lucide-react';

const EmptyState = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
      {/* Friendly illustration - Inbox/Mailbox */}
      <div className="mb-6">
        <div className="w-16 h-16 rounded-full bg-[#B8A5D1]/10 flex items-center justify-center">
          <Inbox className="w-8 h-8 text-[#B8A5D1]" />
        </div>
      </div>

      {/* Warm headline */}
      <h2 className="text-2xl font-semibold text-gray-800 mb-3 font-poppins">
        No Applications Yet
      </h2>

      {/* Encouraging copy */}
      <p className="text-gray-600 max-w-md leading-relaxed">
        When psychologists apply to join Life Psychology, they'll appear here for review. 
        We're excited to build our community of practitioners!
      </p>
    </div>
  );
};

export default EmptyState;
