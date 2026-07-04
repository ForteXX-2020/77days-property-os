import { NextResponse } from "next/server";
import {
  createSourceFileSignedUrl,
  getDealSourceFile
} from "@/lib/sourceFiles";

type SourceFileOpenRouteProps = {
  params: {
    dealId: string;
    sourceFileId: string;
  };
};

export async function GET(_request: Request, { params }: SourceFileOpenRouteProps) {
  try {
    const sourceFile = await getDealSourceFile(params.dealId, params.sourceFileId);

    if (!sourceFile) {
      return new Response("Source file was not found.", { status: 404 });
    }

    const signedUrl = await createSourceFileSignedUrl(sourceFile);

    return NextResponse.redirect(signedUrl);
  } catch (error) {
    return new Response(
      `Could not open source file.\n${
        error instanceof Error ? error.message : "An unknown error occurred."
      }`,
      { status: 500 }
    );
  }
}
