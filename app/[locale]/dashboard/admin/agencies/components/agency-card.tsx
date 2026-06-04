import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link } from "@/i18n/navigation";

type AgencyCardProps = {
  agency: {
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
  };
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

/**
 * Renders a single agency summary card.
 */
export default function AgencyCard({ agency }: AgencyCardProps) {
  return (
    <Link
      href={`/dashboard/admin/agencies/${agency.id}`}
      className="group block"
    >
      <Card className="border-border/60 bg-card shadow-sm transition-all group-hover:-translate-y-0.5 group-hover:shadow-md group-focus-visible:ring-2 group-focus-visible:ring-ring">
        <CardHeader>
          <CardTitle>{agency.name}</CardTitle>
          <CardDescription>
            Created {formatDate(agency.createdAt)}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-3"></CardContent>
      </Card>
    </Link>
  );
}
