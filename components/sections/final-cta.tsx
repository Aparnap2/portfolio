import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function FinalCTASection() {
  return (
    <section id="contact" aria-labelledby="contact-heading" className="bg-background">
      <div className="mx-auto max-w-6xl px-4 py-14 md:px-6 lg:py-20">
        <Card className="border-primary/30">
          <CardContent className="flex flex-col items-start gap-6 p-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <h2 id="contact-heading" className="text-balance text-2xl font-semibold tracking-tight md:text-3xl">
                {"Ready to ship your next AI feature?"}
              </h2>
              <p className="mt-2 text-pretty text-muted-foreground">
                {"Let’s map the path from concept to reliable production. 30-minute discovery call."}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button asChild>
                <Link href="#contact">{"Book a call"}</Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href="#work">{"See case studies"}</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
