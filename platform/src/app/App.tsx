import { RouterProvider } from 'react-router';
import { Analytics } from '@vercel/analytics/react';
import { router } from './routes';
import { JobProvider } from './lib/JobContext';


export default function App() {
  return (
    <JobProvider>
      <RouterProvider router={router} />
      <Analytics />
    </JobProvider>
  );
}
