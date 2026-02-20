"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"

export default function SignUpPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const fullName = formData.get("full_name") as string
    const businessName = formData.get("business_name") as string

    if (!email || !password || !fullName) {
      setError("Todos los campos son requeridos")
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError("La contrasena debe tener al menos 6 caracteres")
      setLoading(false)
      return
    }

    const { error: authError, data } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          full_name: fullName,
          business_name: businessName || "Elite Carwash",
          role: "owner",
        },
      },
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    // If email confirmation is disabled, session exists immediately
    if (data?.session) {
      router.push("/dashboard")
      router.refresh()
    } else {
      router.push("/auth/sign-up-success")
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-6">
          <img
            src="/images/logo.png"
            alt="Elite Carwash Logo"
            style={{ width: 240, height: "auto" }}
          />
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Crear Cuenta
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Registra tu negocio en Elite Carwash
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
          {error && (
            <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor="full_name">Nombre completo</Label>
            <Input
              id="full_name"
              name="full_name"
              type="text"
              placeholder="Tu nombre"
              required
              className="bg-secondary"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="business_name">Nombre del negocio</Label>
            <Input
              id="business_name"
              name="business_name"
              type="text"
              placeholder="Elite Carwash"
              defaultValue="Elite Carwash"
              className="bg-secondary"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Correo electronico</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="tu@email.com"
              required
              autoComplete="email"
              className="bg-secondary"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Contrasena</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Minimo 6 caracteres"
              required
              minLength={6}
              autoComplete="new-password"
              className="bg-secondary"
            />
          </div>

          <Button type="submit" className="mt-2 w-full" disabled={loading}>
            {loading ? "Creando cuenta..." : "Crear Cuenta"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {"Ya tienes una cuenta? "}
          <Link
            href="/auth/login"
            className="font-medium text-primary hover:underline"
          >
            Inicia sesion
          </Link>
        </p>
      </div>
    </main>
  )
}
