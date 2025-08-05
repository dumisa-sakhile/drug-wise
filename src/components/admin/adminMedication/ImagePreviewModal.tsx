import { motion } from "framer-motion";
import { X } from "lucide-react";

interface ImagePreviewModalProps {
  imageUrl: string;
  imageName: string;
  onClose: () => void;
}

function ImagePreviewModal({
  imageUrl,
  imageName,
  onClose,
}: ImagePreviewModalProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-60 p-6"
      onClick={onClose}>
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 15 }}
        className="relative max-w-[90vw] max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}>
        <img
          src={imageUrl}
          alt={imageName}
          className="w-full h-auto object-contain rounded-lg shadow-xl max-w-[90vw] max-h-[90vh]"
        />
        <button
          className="absolute top-2 right-2 text-neutral-200 hover:text-white text-2xl font-light p-2 rounded-full bg-neutral-700 hover:bg-neutral-600 transition-colors duration-200"
          onClick={onClose}
          aria-label="Close image">
          <X />
        </button>
      </motion.div>
    </motion.div>
  );
}

export default ImagePreviewModal;
