import { Link } from 'react-router-dom'
import { PageContainer } from '../components/ui/PageContainer'
import { Button } from '../components/ui/Button'

import { useEffect } from 'react'

export const NotFoundPage = () => {
  useEffect(() => {
    document.title = 'Ahoum | Page Not Found'
  }, [])
  return (
    <PageContainer maxWidth="sm" className="py-20 text-center space-y-4">
      <div className="text-4xl font-extrabold text-slate-900 tracking-tight">404</div>
      <h1 className="text-xl font-bold text-slate-800">Page Not Found</h1>
      <p className="text-sm text-slate-600">
        The page you requested could not be found or has been moved.
      </p>
      <div className="pt-2">
        <Link to="/sessions">
          <Button variant="primary">Return to Sessions</Button>
        </Link>
      </div>
    </PageContainer>
  )
}
