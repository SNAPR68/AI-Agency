import { NextRequest, NextResponse } from "next/server";
import {
  authHasBrandAccess,
  buildLoginPath,
  getAuthenticatedAppState,
  isSafeRedirectPath
} from "../../../../../../../lib/session";
import { savePlatformBrandMemoryProfile } from "../../../../../../../lib/supabase-platform-data";

function parseList(value: FormDataEntryValue | null) {
  return String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

type BrandMemoryActionRouteProps = {
  params: Promise<{
    brandId: string;
  }>;
};

export async function POST(
  request: NextRequest,
  { params }: BrandMemoryActionRouteProps
) {
  const { brandId } = await params;
  const auth = await getAuthenticatedAppState();
  const formData = await request.formData();
  const nextPath = String(formData.get("next") ?? "");

  if (!auth) {
    return NextResponse.redirect(new URL(buildLoginPath(nextPath), request.url), 303);
  }

  if (!authHasBrandAccess(auth, brandId)) {
    return NextResponse.redirect(
      new URL(`/brands/${auth.defaultBrandId}/overview`, request.url),
      303
    );
  }

  await savePlatformBrandMemoryProfile(brandId, {
    positioning: String(formData.get("positioning") ?? ""),
    targetCustomer: String(formData.get("targetCustomer") ?? ""),
    tone: String(formData.get("tone") ?? ""),
    heroProducts: parseList(formData.get("heroProducts")),
    doSay: parseList(formData.get("doSay")),
    dontSay: parseList(formData.get("dontSay")),
    customerPersonas: parseList(formData.get("customerPersonas"))
  });

  const redirectPath =
    nextPath && isSafeRedirectPath(nextPath)
      ? nextPath
      : `/brands/${brandId}/settings/brand-memory`;

  return NextResponse.redirect(new URL(redirectPath, request.url), 303);
}
