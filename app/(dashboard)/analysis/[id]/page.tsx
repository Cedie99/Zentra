import { redirect } from 'next/navigation'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function AnalysisPage({ params }: PageProps) {
  const { id } = await params
  
  // Redirect to Reports page since detailed analysis is now there in tabbed format
  redirect('/reports')
}
