import { redirect } from 'next/navigation'

interface PaymentsIndexPageProps {
  searchParams: Promise<{ sessionId?: string }>
}

export default async function PaymentsIndexPage({ searchParams }: PaymentsIndexPageProps) {
  const params = await searchParams
  if (!params.sessionId) {
    redirect('/scanner')
  }
  redirect(`/exit/${params.sessionId}`)
}
