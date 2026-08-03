import { createServerSupabaseClient } from '@/lib/supabase/server'

export interface StaffCashTotal {
  actor_id: string
  display_name: string | null
  total_centavos: string
}

export async function listStaffCashTotals(
  businessDate?: string,
): Promise<StaffCashTotal[]> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.rpc('list_staff_cash_totals', {
    p_business_date: businessDate ?? null,
  })

  if (error || !Array.isArray(data)) {
    return []
  }

  return data.map((row) => {
    const item = row as Record<string, unknown>
    return {
      actor_id: String(item.actor_id),
      display_name:
        typeof item.display_name === 'string' ? item.display_name : null,
      total_centavos: String(item.total_centavos),
    }
  })
}
