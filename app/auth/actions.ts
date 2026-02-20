"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get("email") as string
  const password = formData.get("password") as string

  if (!email || !password) {
    return { error: "Email y contrasena son requeridos" }
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: "Credenciales invalidas. Intente nuevamente." }
  }

  return { success: true }
}

export async function signUp(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const fullName = formData.get("full_name") as string
  const businessName = formData.get("business_name") as string

  if (!email || !password || !fullName) {
    return { error: "Todos los campos son requeridos" }
  }

  if (password.length < 6) {
    return { error: "La contrasena debe tener al menos 6 caracteres" }
  }

  const { error, data } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo:
        process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
        `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/dashboard`,
      data: {
        full_name: fullName,
        business_name: businessName || "Elite Carwash",
        role: "owner",
      },
    },
  })

  if (error) {
    return { error: error.message }
  }

  // If email confirmation is disabled, user is logged in immediately
  if (data?.session) {
    return { success: true, redirectTo: "/dashboard" }
  }

  // Email confirmation required
  return { success: true, redirectTo: "/auth/sign-up-success" }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/auth/login")
}
