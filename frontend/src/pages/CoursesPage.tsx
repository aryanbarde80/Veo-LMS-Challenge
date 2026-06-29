import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal } from 'lucide-react';
import { api } from '../lib/api';
import { Course } from '../types';
import CourseCard from '../components/course/CourseCard';

const DIFFICULTIES = ['all', 'beginner', 'intermediate', 'advanced'];

export default function CoursesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [difficulty, setDifficulty] = useState('all');

  const { data, isLoading } = useQuery({
    queryKey: ['courses', search, difficulty],
    queryFn: () => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      return api.get(`/courses?${params.toString()}&limit=20`).then((r) => r.data);
    },
  });

  const allCourses: Course[] = data?.courses || [];
  const filtered = difficulty === 'all'
    ? allCourses
    : allCourses.filter((c) => c.difficulty === difficulty);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams(search ? { search } : {});
  };

  return (
    <div className="min-h-screen py-10 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-white mb-2">All Courses</h1>
          <p className="text-[#9B98B8]">Discover our complete library of courses</p>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9B98B8]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search courses..."
                className="w-full pl-10 pr-4 py-3 bg-[#1A1A2E] border border-[#2E2E4A] rounded-xl text-white placeholder-[#9B98B8] focus:outline-none focus:border-[#6C47FF] transition-colors"
              />
            </div>
          </form>

          {/* Difficulty Filter */}
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-[#9B98B8]" />
            <div className="flex gap-2">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                    difficulty === d
                      ? 'bg-[#6C47FF] text-white'
                      : 'bg-[#1A1A2E] text-[#9B98B8] hover:text-white border border-[#2E2E4A]'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results count */}
        <p className="text-sm text-[#9B98B8] mb-6">
          {filtered.length} course{filtered.length !== 1 ? 's' : ''} found
        </p>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-[#1A1A2E] rounded-xl overflow-hidden animate-pulse">
                <div className="aspect-video bg-[#242438]" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-[#242438] rounded w-3/4" />
                  <div className="h-3 bg-[#242438] rounded w-full" />
                  <div className="h-3 bg-[#242438] rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        ) : (
          <div className="text-center py-24">
            <Search className="w-12 h-12 text-[#2E2E4A] mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-[#9B98B8] mb-2">No courses found</h3>
            <p className="text-[#9B98B8] text-sm">Try different keywords or filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
