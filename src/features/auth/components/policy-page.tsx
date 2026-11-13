import { readFile } from "node:fs/promises";
import { join } from "node:path";
import Link from "next/link";

export async function PolicyPage({ name }: { name: "terms" | "privacy" }) {
  const markdown = await readFile(join(process.cwd(), "content", "policies", `${name}.md`), "utf8");
  // These policy files use headings and paragraphs. React renders their content as text.
  return (
    <main className="mx-auto w-full max-w-2xl space-y-5 px-6 py-12 leading-relaxed text-foreground">
      <Link href="/register" className="text-sm underline">
        Back to registration
      </Link>
      {markdown
        .trim()
        .split(/\r?\n\s*\r?\n/)
        .map((block, index) => {
          if (block.startsWith("# "))
            return (
              <h1 key={index} className="text-3xl font-semibold">
                {block.slice(2)}
              </h1>
            );
          if (block.startsWith("## "))
            return (
              <h2 key={index} className="pt-2 text-xl font-semibold">
                {block.slice(3)}
              </h2>
            );
          return <p key={index}>{block}</p>;
        })}
      <Link
        href={name === "terms" ? "/privacy" : "/terms"}
        className="inline-block text-sm underline"
      >
        {name === "terms" ? "Privacy Policy" : "Terms of Service"}
      </Link>
    </main>
  );
}
