import {
  createApiError,
  createApiResponse
} from "../../../../../../lib/api";
import { getBrandProductDetailAsync } from "../../../../../../lib/growth-workflow-data";
import { getAuthorizedBrandState } from "../../../../../../lib/session";

type ProductDetailRouteProps = {
  params: Promise<{
    brandId: string;
    productId: string;
  }>;
};

export async function GET(_request: Request, { params }: ProductDetailRouteProps) {
  const { brandId, productId } = await params;
  const auth = await getAuthorizedBrandState(brandId);

  if (!auth) {
    return createApiError(403, "forbidden", "You do not have access to this brand.");
  }

  const product = await getBrandProductDetailAsync(brandId, productId);

  if (!product) {
    return createApiError(404, "not_found", "Product not found.");
  }

  return createApiResponse({
    brandId,
    product
  });
}
