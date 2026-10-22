import { searchPlaces } from "@/lib/places";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q") ?? "";
  return Response.json(searchPlaces(query));
}
