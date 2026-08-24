import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-20">
      <Badge>About ACAB</Badge>
      <h1 className="mt-5 max-w-3xl text-5xl font-semibold tracking-tight">
        The infrastructure behind better builds.
      </h1>
      <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
        We bring the practical rhythm of a well-run warehouse into one shared
        workspace for construction teams.
      </p>
      <Separator className="my-16" />
      <div className="grid gap-4 md:grid-cols-3">
        {[
          ["12k+", "items tracked"],
          ["98%", "on-time handoffs"],
          ["24/7", "visibility"],
        ].map(([value, label]) => (
          <Card key={label} className="rounded-2xl">
            <CardContent className="p-6">
              <strong className="text-4xl">{value}</strong>
              <p className="mt-2 text-muted-foreground">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="mt-16 flex items-center gap-4">
        <Avatar>
          <AvatarFallback>AC</AvatarFallback>
        </Avatar>
        <p className="text-sm text-muted-foreground">
          Built by operators who know the pressure of the worksite.
        </p>
      </div>
    </div>
  );
}
