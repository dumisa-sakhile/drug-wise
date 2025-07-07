import React from 'react';
import { motion } from 'framer-motion';
import { Link } from '@tanstack/react-router';
import { ArrowRight } from 'lucide-react';

interface OverviewCardProps {
  title: string;
  value: string | number;
  subValue?: string | number;
  icon: React.ReactNode;
  description: string;
  link?: string;
  linkLabel?: string;
  onClick?: () => void;
  color: string;
}

const OverviewCard: React.FC<OverviewCardProps> = ({
  title,
  value,
  subValue,
  icon,
  description,
  link,
  linkLabel,
  onClick,
  color,
}) => {
  const CardContent = () => (
    <>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/5 rounded-md flex items-center justify-center">
            {icon}
          </div>
          <h3 className="text-lg roboto-condensed-bold text-white">{title}</h3>
        </div>
        <div className="text-right">
          {value !== "" && (
            <p className="text-3xl roboto-condensed-bold text-white">{value}</p>
          )}
          {subValue && (
            <p className="text-sm roboto-condensed-light text-gray-400">
              {subValue}
            </p>
          )}
        </div>
      </div>
      <p className="text-gray-400 roboto-condensed-light mb-4 text-sm">
        {description}
      </p>
      {linkLabel && (
        <span className="text-blue-400 roboto-condensed-bold text-sm flex items-center gap-1 hover:text-blue-300 transition-colors duration-200">
          {linkLabel} <ArrowRight size={14} />
        </span>
      )}
    </>
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={`${color} rounded-xl p-5 shadow-lg border border-white/10 relative overflow-hidden group cursor-pointer`}
      whileHover={{ y: -3, boxShadow: '0 10px 20px rgba(0,0,0,0.3)' }}
      whileTap={{ scale: 0.98 }}
    >
      {link ? (
        <Link to={link} className="block w-full h-full">
          <CardContent />
        </Link>
      ) : (
        <div onClick={onClick} className="block w-full h-full">
          <CardContent />
        </div>
      )}
    </motion.div>
  );
};

export default OverviewCard;