import { NextResponse } from "next/server";

type ApiError = {
  code: string;
  message: string;
};

export function createApiResponse<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(
    {
      data,
      meta: {
        generatedAt: new Date().toISOString()
      },
      errors: [] as ApiError[]
    },
    init
  );
}

export function createApiError(
  status: number,
  code: string,
  message: string
) {
  return NextResponse.json(
    {
      data: null,
      meta: {
        generatedAt: new Date().toISOString()
      },
      errors: [
        {
          code,
          message
        }
      ] satisfies ApiError[]
    },
    {
      status
    }
  );
}
