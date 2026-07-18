'use server'

import { redirect } from 'next/navigation'

import { loginSchema } from '@/features/auth/schemas'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export interface AuthActionState {
  error: string | null
}

export async function signInAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? 'Invalid credentials',
    }
  }

  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)

  if (error) {
    return { error: 'Invalid email or password' }
  }

  const nextPath = formData.get('next')
  const destination =
    typeof nextPath === 'string' && nextPath.startsWith('/') ? nextPath : '/dashboard'

  redirect(destination)
}

export async function signOutAction() {
  const supabase = await createServerSupabaseClient()
  await supabase.auth.signOut()
  redirect('/login')
}
