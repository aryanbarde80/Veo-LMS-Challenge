export const Skeleton = ({
  className = '',
  width = '100%',
  height = '1rem',
}: {
  className?: string;
  width?: string;
  height?: string;
}) => (
  <div
    className={`animate-pulse bg-gradient-to-r from-[#1A1A2E] via-[#2E2E4A] to-[#1A1A2E] rounded ${className}`}
    style={{ width, height }}
  />
);

export const SkeletonCard = ({ count = 3 }: { count?: number }) => (
  <div className="space-y-4">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="bg-[#16213E] rounded-lg p-4 space-y-3">
        <Skeleton height="1.5rem" className="w-3/4" />
        <Skeleton height="1rem" className="w-full" />
        <Skeleton height="1rem" className="w-5/6" />
      </div>
    ))}
  </div>
);

export const SkeletonText = ({ lines = 3 }: { lines?: number }) => (
  <div className="space-y-2">
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        height="1rem"
        className={i === lines - 1 ? 'w-5/6' : 'w-full'}
      />
    ))}
  </div>
);

export const SkeletonAvatar = ({ size = 10 }: { size?: number }) => (
  <Skeleton
    className="rounded-full"
    width={`${size}rem`}
    height={`${size}rem`}
  />
);
