import { Button } from "@/components/ui/button"
import { Mail } from "lucide-react"
import Link from "next/link"

export default function SignUpSuccessPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm text-center">
        <div className="flex flex-col items-center gap-6">
          <img
            src="/images/logo.png"
            alt="AutoLimpio Logo"
            style={{ width: 200, height: "auto" }}
          />
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Revisa tu correo
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Te hemos enviado un enlace de confirmacion. Haz clic en el enlace
              para activar tu cuenta y comenzar a usar AutoLimpio App.
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
