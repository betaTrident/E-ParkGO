import { notFound, redirect } from 'next/navigation'

interface PaymentPageProps {
  params: Promise<{ sessionId: string }>
}

export default async function PaymentPage({ params }: PaymentPageProps) {
  const { sessionId } = await params

  if (!sessionId) {
    notFound()
  }

  redirect(`/exit/${sessionId}`)
}
