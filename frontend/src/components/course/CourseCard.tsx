import { Link } from 'react-router-dom';
import { Clock, Users, Star } from 'lucide-react';
import { Course } from '../../types';
import { formatPrice, formatMinutes, difficultyColor, cn } from '../../lib/utils';

interface CourseCardProps {
  course: Course;
}

export default function CourseCard({ course }: CourseCardProps) {
  return (
    <Link to={`/courses/${course.slug}`} className="group block">
      <div className="bg-[#1A1A2E] border border-[#2E2E4A] rounded-xl overflow-hidden card-hover">
        {/* Thumbnail */}
        <div className="relative aspect-video overflow-hidden">
          <img
            src={course.thumbnail}
            alt={course.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
          {course.isFeatured && (
            <div className="absolute top-2 left-2 px-2 py-1 bg-[#6C47FF] text-white text-xs font-semibold rounded-md">
              Featured
            </div>
          )}
          <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 text-white text-xs rounded-md flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatMinutes(course.totalDuration)}
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Difficulty badge */}
          <div className="flex items-center gap-2 mb-2">
            <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', difficultyColor(course.difficulty))}>
              {course.difficulty}
            </span>
          </div>

          <h3 className="font-semibold text-[#F0EFF8] text-sm leading-snug line-clamp-2 mb-1 group-hover:text-[#6C47FF] transition-colors">
            {course.title}
          </h3>

          <p className="text-xs text-[#9B98B8] mb-3 line-clamp-2">{course.shortDescription}</p>

          <p className="text-xs text-[#9B98B8] mb-3">by {course.instructorName}</p>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs text-[#9B98B8]">
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {course.enrollmentCount || 0}
              </span>
            </div>
            <span className="font-bold text-[#6C47FF]">{formatPrice(course.price)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
