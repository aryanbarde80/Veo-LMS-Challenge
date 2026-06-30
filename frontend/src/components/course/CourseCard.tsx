import { Link } from 'react-router-dom';
import { Clock, Users, Star } from 'lucide-react';
import { Course } from '../../types';
import { formatPrice, formatMinutes, difficultyColor, cn } from '../../lib/utils';

interface CourseCardProps {
  course: Course;
  featured?: boolean;
}

export default function CourseCard({ course, featured }: CourseCardProps) {
  const isFree = parseFloat(course.price) === 0;

  return (
    <Link to={`/courses/${course.slug}`} className="group block h-full">
      <div className={cn(
        'bg-[#1A1A2E] border border-[#2E2E4A] rounded-xl overflow-hidden card-hover h-full flex flex-col',
        featured && 'border-[#6C47FF]/30'
      )}>
        {/* Thumbnail */}
        <div className="relative aspect-video overflow-hidden shrink-0">
          <img
            src={course.thumbnail}
            alt={course.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          {/* Badges */}
          <div className="absolute top-2 left-2 flex gap-1.5">
            {course.isFeatured && (
              <span className="px-2 py-0.5 bg-[#6C47FF] text-white text-xs font-semibold rounded-md shadow">
                Featured
              </span>
            )}
            {isFree && (
              <span className="px-2 py-0.5 bg-green-500 text-white text-xs font-semibold rounded-md shadow">
                Free
              </span>
            )}
          </div>
          {/* Duration pill */}
          <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/75 text-white text-xs rounded-md flex items-center gap-1 backdrop-blur-sm">
            <Clock className="w-3 h-3" />
            {formatMinutes(course.totalDuration)}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col flex-1">
          {/* Difficulty */}
          <div className="mb-2">
            <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', difficultyColor(course.difficulty))}>
              {course.difficulty}
            </span>
          </div>

          {/* Title */}
          <h3 className="font-semibold text-[#F0EFF8] text-sm leading-snug line-clamp-2 mb-1.5 group-hover:text-[#8B6FFF] transition-colors flex-1">
            {course.title}
          </h3>

          {/* Instructor */}
          <p className="text-xs text-[#9B98B8] mb-3 truncate">
            by <span className="text-[#C5C3D8]">{course.instructorName}</span>
          </p>

          {/* Meta row */}
          <div className="flex items-center justify-between mt-auto pt-3 border-t border-[#2E2E4A]">
            <div className="flex items-center gap-3 text-xs text-[#9B98B8]">
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {(course.enrollmentCount || 0).toLocaleString()}
              </span>
              <span className="flex items-center gap-1 text-yellow-400">
                <Star className="w-3 h-3 fill-yellow-400" />
                4.8
              </span>
            </div>
            <span className={cn(
              'font-bold text-sm',
              isFree ? 'text-green-400' : 'text-[#6C47FF]'
            )}>
              {formatPrice(course.price)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
