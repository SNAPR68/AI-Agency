import { BrandShell } from "../../../components/brand-shell";
import { requireAuthorizedBrandState } from "../../../lib/session";

type BrandLayoutProps = Readonly<{
  children: React.ReactNode;
  params: Promise<{
    brandId: string;
  }>;
}>;

export default async function BrandLayout({ children, params }: BrandLayoutProps) {
  const { brandId } = await params;
  const auth = await requireAuthorizedBrandState(
    brandId,
    `/brands/${brandId}/overview`
  );

  return (
    <BrandShell
      brandId={brandId}
      brandName={auth.workspace.name}
      activeUserName={auth.workspace.activeUser.name}
      activeUserRole={auth.workspace.activeUser.role}
      vertical={auth.workspace.vertical}
      gmvBand={auth.workspace.gmvBand}
      accessibleBrands={auth.accessibleBrands}
    >
      {children}
    </BrandShell>
  );
}
