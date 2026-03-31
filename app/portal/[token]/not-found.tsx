import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function PortalNotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <img
        src="/images/logo.png"
        alt="AutoLimpio"
        className="mb-6"
        style={{ width: 180, height: "auto" }}
      />
      <h1 className="text-2xl font-bold text-foreground">
        Enlace no valido
      </h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Este enlace de portal no existe o ha expirado. Contacta a tu lavadero
        para obtener un nuevo enlace.
      </p>
      <Button asChild className="mt-6">
        <Link href="/">Ir al inicio</Link>
      </Button>
    </main>
  )
}
