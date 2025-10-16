import { Inbox } from 'lucide-react';

const EmptyState = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-6">
      {/* Friendly illustration - Inbox/Mailbox */}
      <div className="mb-6">
        <div className="w-24 h-24 rounded-full bg-lavender-50 flex items-center justify-center">
          <Inbox className="w-12 h-12 text-lavender-400" />
        </div>
      </div>

      {/* Warm headline */}
      <h2 className="text-2xl font-semibold text-text-primary mb-3 font-display">
        No Applications Yet
      </h2>

      {/* Encouraging copy */}
      <p className="text-text-secondary max-w-md leading-loose font-body">
        When psychologists apply to join Life Psychology, they'll appear here for review. 
        We're excited to build our community of practitioners!
      </p>
    </div>
  );
};

export default EmptyState;
