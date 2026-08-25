import { getLastStudiedExamId } from '@/storage'
import { RootLayout } from './app/root-layout'
import { Suspense } from 'react';

export default function App() {
  const lastStudiedExamIdPromise = getLastStudiedExamId();
  return (
    <Suspense>
      <RootLayout lastStudiedExamIdPromise={lastStudiedExamIdPromise} />
    </Suspense>
  )
}
