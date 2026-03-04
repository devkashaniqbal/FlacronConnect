import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import App from './App'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 1000 * 60 * 5 },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          className: 'font-sans text-sm',
          duration: 4000,
          style: { borderRadius: '12px', padding: '12px 16px' },
        }}
      />
    </QueryClientProvider>
  </React.StrictMode>
)
