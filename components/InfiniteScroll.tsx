import React, { MutableRefObject, useEffect, useRef } from "react";

export interface InfiniteScrollProps {
  hasMore: boolean
  isLoading: boolean
  onNextPage: () => void | Promise<void>
  children: (props: {
    bottomSentinelRef: MutableRefObject<any>
  }) => React.ReactNode
}

export function InfiniteScroll({ hasMore, isLoading, onNextPage, children } : InfiniteScrollProps) {
  const bottomSentinelRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    const observer = new IntersectionObserver(entries => {
      const firstEntry = entries[0]
      if (firstEntry.isIntersecting && !isLoading && hasMore && !cancelled) {
        onNextPage()
      }
    }, { root: null, threshold: 1.0 })

    if (bottomSentinelRef.current) {
      observer.observe(bottomSentinelRef.current)
    }
    const targetRef = bottomSentinelRef.current
    return () => {
      cancelled = true
      if (targetRef) {
        observer.unobserve(targetRef)
      }
    }
  }, [isLoading, hasMore, bottomSentinelRef, onNextPage])

  return <div>{children({bottomSentinelRef})}</div>
}