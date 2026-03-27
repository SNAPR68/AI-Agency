import { redirect } from "next/navigation";
import { getDefaultBrandPath } from "../lib/navigation";
import { getAuthenticatedAppState } from "../lib/session";

export default async function HomePage() {
  const auth = await getAuthenticatedAppState();

  if (auth) {
    redirect(getDefaultBrandPath(auth.session.brandId));
  }

  redirect("/api/auth/preview");
}
