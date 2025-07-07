import React from 'react';
import { Link } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

interface TaskItemProps {
  icon: React.ReactNode;
  text: string;
  actionLabel: string;
  actionOnClick?: () => void;
  actionLink?: string;
}

const TaskItem: React.FC<TaskItemProps> = ({
  icon,
  text,
  actionLabel,
  actionOnClick,
  actionLink,
}) => {
  const TaskAction = () => {
    return actionLink ? (
      <Link
        to={actionLink}
        className="text-blue-400 roboto-condensed-bold text-sm flex items-center gap-1 hover:text-blue-300 transition-colors duration-200"
      >
        {actionLabel} <ArrowRight size={14} />
      </Link>
    ) : (
      <button
        onClick={actionOnClick}
        className="text-blue-400 roboto-condensed-bold text-sm flex items-center gap-1 hover:text-blue-300 transition-colors duration-200"
      >
        {actionLabel} <ArrowRight size={14} />
      </button>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="bg-white/5 rounded-lg p-4 shadow-sm border border-white/10 flex items-center justify-between"
    >
      <div className="flex items-center gap-3">
        {icon}
        <span className="roboto-condensed-light text-white text-base flex-grow">
          {text}
        </span>
      </div>
      <TaskAction />
    </motion.div>
  );
};

export default TaskItem;