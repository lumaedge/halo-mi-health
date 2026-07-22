import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-[20px] border border-[#e5e5ea]/40 bg-white p-5 space-y-3", className)}>
      <div className="flex items-start gap-3">
        <Skeleton className="w-10 h-10 rounded-[12px]" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/5" />
          <Skeleton className="h-3 w-4/5" />
        </div>
      </div>
      <Skeleton className="h-3 w-2/5" />
    </div>
  )
}

function CardGridSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  )
}

function CardListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="rounded-[24px] p-6 lg:p-8 bg-[#f5f5f7] border border-[#e5e5ea]/30">
        <Skeleton className="h-8 w-3/5 mb-2" />
        <Skeleton className="h-4 w-2/5" />
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <Skeleton className="h-[88px] rounded-[20px]" />
        <Skeleton className="h-[88px] rounded-[20px]" />
      </div>
      <Skeleton className="h-[140px] rounded-[20px]" />
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-[20px] border border-[#e5e5ea]/40 bg-white p-5 space-y-3">
            <Skeleton className="w-10 h-10 rounded-[12px]" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-4/5" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function TimelineSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div>
        <Skeleton className="h-8 w-1/3 mb-2" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-[20px] border border-[#e5e5ea]/40 bg-white p-4 flex items-center gap-4">
            <Skeleton className="w-2 h-2 rounded-full" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-2/5" />
              <Skeleton className="h-3 w-1/4" />
            </div>
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function HealthChecksSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div>
        <Skeleton className="h-8 w-1/3 mb-2" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <Skeleton className="h-[200px] rounded-[20px]" />
    </div>
  )
}

export function ProfileSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="rounded-[24px] p-6 lg:p-8 bg-[#f5f5f7]">
        <div className="flex items-center gap-4">
          <Skeleton className="w-[56px] h-[56px] rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </div>
      <CardListSkeleton count={3} />
    </div>
  )
}

export function CardListSkeletonFallback({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-1/3 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <Skeleton className="w-20 h-9 rounded-[14px]" />
      </div>
      <CardListSkeleton count={count} />
    </div>
  )
}

export { CardSkeleton, CardGridSkeleton, CardListSkeleton }
