import { getExamList, getLastStudiedExamId } from '@/storage'
import { RootLayout } from './app/root-layout'
import { Suspense } from 'react';

export default function App() {
  const lastStudiedExamIdPromise = getLastStudiedExamId();
  const examListPromise = getExamList();
  return (
    <Suspense>
      <RootLayout
        lastStudiedExamIdPromise={lastStudiedExamIdPromise} 
        examListPromise={examListPromise}  
      />
    </Suspense>
  )
}
