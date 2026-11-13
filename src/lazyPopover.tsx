import { lazy, Suspense, type ComponentType } from 'react';

/** A popover in its own chunk, fetched the first time it opens. Renders nothing
 *  while loading (the chunk is already in the service-worker cache on web and
 *  in the APK on Android, so the wait is a frame or two). */
export function lazyPopover<P extends object>(
  load: () => Promise<ComponentType<P>>,
): ComponentType<P> {
  const Inner = lazy(() => load().then((c) => ({ default: c }))) as unknown as ComponentType<P>;
  return function LazyPopover(props: P) {
    return (
      <Suspense fallback={null}>
        <Inner {...props} />
      </Suspense>
    );
  };
}
