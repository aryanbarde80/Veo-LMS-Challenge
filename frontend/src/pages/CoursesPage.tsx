import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { api } from '../lib/api';
import { Course } from '../types';
import CourseCard from '../components/course/CourseCard';
import { cn } from '../lib/utils';

const DIFFICULTIES = ['all', 'beginner', 'intermediate', 'advanced'] as const;
const SORTS = [
  { value: 'newest', label: 'Newest' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
] as const;

export default function CoursesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [inputValue, setInputValue] = useState(searchParams.get('search') || '');
  const [difficulty, setDifficulty] = useState<string>('all');
  const [sort, setSort] = useState<string>('newest');
  const [showFreeOnly, setShowFreeOnly] = useState(false);

  // Sync URL search param to local state on mount
  useEffect(() => {
    const q = searchParams.get('search') || '';
    setSearch(q);
    setInputValue(q);
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ['courses', search],
    queryFn: () => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      params.set('limit', '40');
      return api.get(`/courses?${params.toString()}`).then((r) => r.data);
    },
  });

  const allCourses: Course[] = data?.courses || [];

  // Client-side filters + sort
  const filtered = allCourses
    .filter((c) => difficulty === 'all' || c.difficulty === difficulty)
    .filter((c) => !showFreeOnly || parseFloat(c.price) === 0)
    .sort((a, b) => {
      if (sort === 'popular') return (b.enrollmentCount || 0) - (a.enrollmentCount || 0);
      if (sort === 'price-asc') return parseFloat(a.price) - parseFloat(b.price);
      if (sort === 'price-desc') return parseFloat(b.price) - parseFloat(a.price);
      // newest
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = inputValue.trim();
    setSearch(q);
    setSearchParams(q ? { search: q } : {});
  };

  const clearSearch = () => {
    setInputValue('');
    setSearch('');
    setSearchParams({});
  };

  const hasActiveFilters = difficulty !== 'all' || showFreeOnly || sort !== 'newest';

  return (
    <div className="min-h-screen py-10 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">All Courses</h1>
          <p className="text-[#9B98B8]">Discover our complete library of courses</p>
        </div>

        {/* Search & Filters */}
        <div className="bg-[#1A1A2E] border border-[#2E2E4A] rounded-xl p-4 mb-6 space-y-4">
          {/* Search bar */}
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9B98B8]" />
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Search courses by title, topic, or instructor..."
              className="w-full pl-10 pr-10 py-3 bg-[#0F0F1A] border border-[#2E2E4A] rounded-xl text-white placeholder-[#9B98B8] focus:outline-none focus:border-[#6C47FF] transition-colors text-sm"
            />
            {inputValue && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9B98B8] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </form>

          {/* Filter row */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
            <SlidersHorizontal className="w-4 h-4 text-[#9B98B8] shrink-0" />

            {/* Difficulty */}
            <div className="flex gap-1.5 flex-wrap">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize',
                    difficulty === d
                      ? 'bg-[#6C47FF] text-white'
                      : 'bg-[#0F0F1A] text-[#9B98B8] hover:text-white border border-[#2E2E4A]'
                  )}
                >
                  {d}
                </button>
              ))}
            </div>

            {/* Divider */}
            <div className="hidden sm:block h-4 w-px bg-[#2E2E4A]" />

            {/* Free only toggle */}
            <button
              onClick={() => setShowFreeOnly(!showFreeOnly)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border',
                showFreeOnly
                  ? 'bg-green-500/20 text-green-400 border-green-500/40'
                  : 'bg-[#0F0F1A] text-[#9B98B8] hover:text-white border-[#2E2E4A]'
              )}
            >
              Free Only
            </button>

            {/* Sort */}
            <div className="sm:ml-auto">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="bg-[#0F0F1A] border border-[#2E2E4A] text-[#9B98B8] text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-[#6C47FF] cursor-pointer"
              >
                {SORTS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Results summary */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-[#9B98B8]">
            {isLoading ? 'Loading...' : `${filtered.length} course${filtered.length !== 1 ? 's' : ''} found`}
          </p>
          {hasActiveFilters && (
            <button
              onClick={() => { setDifficulty('all'); setShowFreeOnly(false); setSort('newest'); }}
              className="text-xs text-[#6C47FF] hover:text-[#8B6FFF] flex items-center gap-1"
            >
              <X className="w-3 h-3" /> Clear filters
            </button>
          )}
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-[#1A1A2E] rounded-xl overflow-hidden animate-pulse">
                <div className="aspect-video bg-[#242438]" />
                <div className="p-4 space-y-3">
                  <div className="h-3 bg-[#242438] rounded w-1/3" />
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
          <div className="text-center py-24 bg-[#1A1A2E] border border-[#2E2E4A] rounded-2xl">
            <Search className="w-12 h-12 text-[#2E2E4A] mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No courses found</h3>
            <p className="text-[#9B98B8] text-sm mb-6">Try different keywords or clear your filters</p>
            <button
              onClick={() => { clearSearch(); setDifficulty('all'); setShowFreeOnly(false); }}
              className="px-5 py-2.5 bg-[#6C47FF] hover:bg-[#5234DB] text-white text-sm rounded-xl font-medium transition-colors"
            >
              Clear all
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
