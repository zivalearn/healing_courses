import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Course } from '../models/course';
import { Clock, Star, Heart, Award, ShieldCheck, ArrowRight, BookOpen, Layers } from 'lucide-react';
import { sanitizeImageUrl, DEFAULT_COURSE_IMAGE } from '../utils/imageUtils';

interface CourseCardProps {
  course: Course;
  onKnowMore?: (course: Course) => void;
  onEnroll?: (course: Course) => void;
  isWishlisted?: boolean;
  onToggleWishlist?: (course: Course) => void;
  index: number;
}

export const CourseCard: React.FC<CourseCardProps> = ({
  course,
  onKnowMore,
  onEnroll,
  isWishlisted = false,
  onToggleWishlist,
  index
}) => {
  const navigate = useNavigate();
  const courseSlug = course.slug || course.id;

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onToggleWishlist) {
      onToggleWishlist(course);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="bg-white rounded-2xl p-4 border border-[#C8E6E1] flex flex-col hover:border-[#287687] hover:shadow-lg transition-all duration-300 h-full group relative"
    >
      {/* Thumbnail */}
      <Link to={`/course/${courseSlug}`} className="h-36 sm:h-40 bg-[#E2F1EE] rounded-xl mb-3 overflow-hidden relative block">
        <img
          src={sanitizeImageUrl(course.thumbnail || course.image)}
          alt={course.title || course.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = DEFAULT_COURSE_IMAGE;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        
        {/* Wishlist Button Overlay */}
        <button
          onClick={handleWishlistClick}
          aria-label="Add to Wishlist"
          className="absolute top-2.5 left-2.5 w-8 h-8 rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center text-[#102A36] hover:bg-white transition-all shadow-md cursor-pointer group/btn"
        >
          <Heart
            className={`w-4 h-4 transition-transform group-hover/btn:scale-110 ${
              isWishlisted ? 'fill-rose-500 text-rose-500' : 'text-gray-600 hover:text-rose-500'
            }`}
          />
        </button>

        {/* Rating Overlay */}
        <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded-md text-[10px] font-semibold text-amber-300">
          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
          <span>{course.rating.toFixed(1)}</span>
        </div>

        {course.badge && (
          <div className="absolute top-2 right-2 bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-white text-[9px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full shadow-xs">
            {course.badge}
          </div>
        )}
      </Link>

      {/* Course Info */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-center text-[10px] font-bold text-[#287687] tracking-widest uppercase mb-1">
            <span className="flex items-center gap-1">{course.duration}</span>
            <span className="text-[#B8860B] bg-[#FDF8E7] px-2 py-0.5 rounded-md border border-[#E8D49E] font-extrabold">{course.currency}{course.price.toLocaleString()}</span>
          </div>

          <Link to={`/course/${courseSlug}`}>
            <h4 className="font-serif text-lg font-bold text-[#102A36] mb-1.5 leading-snug group-hover:text-[#287687] transition-colors line-clamp-1">
              {course.title || course.name}
            </h4>
          </Link>

          <p className="text-[#486D7A] text-xs line-clamp-2 leading-relaxed mb-3">
            {course.shortDescription}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-[#C8E6E1]">
          <Link
            to={`/course/${courseSlug}`}
            className="w-full border border-[#287687] text-[#287687] py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-[#287687] hover:text-white transition-colors cursor-pointer text-center block"
          >
            Know More
          </Link>
          
          <button
            onClick={() => {
              if (onEnroll) {
                onEnroll(course);
              } else {
                navigate(`/course/${courseSlug}`);
              }
            }}
            className="w-full bg-[#102A36] text-white py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-[#287687] transition-colors cursor-pointer text-center block"
          >
            Enroll Now
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default CourseCard;
