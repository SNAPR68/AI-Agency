import { redirect } from "next/navigation";
import { getDefaultBrandPath } from "../../../lib/navigation";

type BrandIndexPageProps = {
  params: Promise<{
    brandId: string;
  }>;
};

export default async function BrandIndexPage({ params }: BrandIndexPageProps) {
  const { brandId } = await params;

  redirect(getDefaultBrandPath(brandId));
}
