import { Outlet } from 'react-router-dom'
import { Navbar } from './Navbar'

export const AppLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900">
      <Navbar />
      <div className="flex-1">
        <Outlet />
      </div>
      <footer className="border-t border-slate-200 py-6 mt-auto bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div>
            &copy; {new Date().getFullYear()} Ahoum Marketplace. All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <span>Live Interactive Sessions</span>
            <span>&bull;</span>
            <span>REST API v1</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
