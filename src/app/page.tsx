import { notFound } from "next/navigation";

export default function DecoyPage() {
  // Explicitly trigger 404 for the root page on the custom domain
  // (Middleware also handles this, but this is a double safety)
  notFound();
}
