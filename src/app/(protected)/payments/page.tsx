import { notFound, redirect } from 'next/navigation'

interface PaymentsIndexPageProps {
  searchParams: Promise<{ sessionId?: string }>
}

export default async function PaymentsIndexPage({ searchParams }: PaymentsIndexPageProps) {
  const params = await searchParams
  if (!params.sessionId) {
    notFound()
  }
  redirect(`/payments/${params.sessionId}`)
}
