import { supabase } from "@/app/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  // Get total count
  const { count } = await supabase
    .from("quotes")
    .select("*", { count: "exact", head: true });

  if (!count || count === 0) {
    return Response.json({
      quote: {
        text: "Залазь через мусорку, не тупи!",
        author: "NeverLove",
      },
    });
  }

  // Random offset
  const offset = Math.floor(Math.random() * count);
  const { data } = await supabase
    .from("quotes")
    .select("content, username")
    .range(offset, offset)
    .limit(1);

  if (data && data.length > 0) {
    return Response.json({
      quote: {
        text: data[0].content,
        author: data[0].username,
      },
    });
  }

  return Response.json({
    quote: {
      text: "Пушим слева, двое прикрывают",
      author: "NeverLove",
    },
  });
}
