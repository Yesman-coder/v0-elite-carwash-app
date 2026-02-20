import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"
import Link from "next/link"

export default function AuthErrorPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm text-center">
        <div className="flex flex-col items-center gap-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Error de autenticacion
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Ocurrio un problema durante la autenticacion. Por favor intenta
              nuevamente.
            </p>
          </div>
        </div>
        <div className="mt-8">
          <Button asChild className="w-full">
            <Link href="/auth/login">Volver al inicio de sesion</Link>
          </Button>
        </div>
      </div>
    </main>
  )
}
