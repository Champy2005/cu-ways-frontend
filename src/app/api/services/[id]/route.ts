import { changeMarketerService } from "@/features/marketers/api-route";

type ServiceContext = { params: Promise<{ id: string }> };

export async function PUT(request: Request, context: ServiceContext): Promise<Response> {
  const { id } = await context.params;
  return changeMarketerService(request, id, "PUT");
}

export async function DELETE(request: Request, context: ServiceContext): Promise<Response> {
  const { id } = await context.params;
  return changeMarketerService(request, id, "DELETE");
}
