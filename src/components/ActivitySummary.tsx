import React from 'react';
import { Link } from '@tanstack/react-router';
import { ArrowRight } from 'lucide-react';

interface ActivitySummaryProps {
  icon?: React.ReactNode;
  title: string;
  detail: string;
  link?: string;
  isNew?: boolean;
}

const ActivitySummary: React.FC<ActivitySummaryProps> = ({
  icon,
  title,
  detail,
  link,
  isNew = false,
}) => {
  const content = (
    <div
      className={`flex items-start p-3 rounded-lg border border-transparent ${
        isNew ? 'bg-blue-600/10 border-blue-600/30' : 'bg-white/5'
      } hover:bg-white/10 transition-colors duration-200`}
    >
      {icon && <div className="mr-3 flex-shrink-0 mt-0.5">{icon}</div>}
      <div className="flex-grow">
        <h4 className="roboto-condensed-bold text-white text-base">{title}</h4>
        <p className="text-gray-400 roboto-condensed-light text-sm">{detail}</p>
      </div>
      {link && (
        <span className="ml-3 text-blue-400 roboto-condensed-bold hover:text-blue-300 text-sm flex-shrink-0 flex items-center gap-1">
          View <ArrowRight size={14} />
        </span>
      )}
    </div>
  );

  return link ? (
    <Link to={link} className="block">
      {content}
    </Link>
  ) : (
    <>{content}</>
  );
};

export default ActivitySummary;