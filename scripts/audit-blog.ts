import { BLOG_POSTS } from '../src/data/blogPosts';

const MIN_WORDS = 800;

const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

const postWords = (post: (typeof BLOG_POSTS)[number]) =>
  words(
    [
      post.title,
      post.description,
      ...post.blocks.flatMap((b) => [b.text ?? '', ...(b.items ?? [])]),
      ...(post.faqs ?? []).flatMap((f) => [f.q, f.a]),
    ].join(' '),
  );

let total = 0;
const shallow: string[] = [];

for (const post of BLOG_POSTS) {
  const w = postWords(post);
  total += w;
  const headings = post.blocks.filter((b) => b.type === 'heading').length;
  console.log(
    `${post.slug.padEnd(42)} ${String(w).padStart(5)} words  ${headings} headings  ` +
      `${post.faqs?.length ?? 0} faqs  reads ${Math.ceil(w / 200)} min (declared ${post.readingMinutes})`,
  );
  if (w < MIN_WORDS) shallow.push(`${post.slug} (${w} words)`);
}

console.log(`\nTOTAL: ${total} words across ${BLOG_POSTS.length} posts`);

if (shallow.length > 0) {
  console.error(`\n${shallow.length} post(s) under ${MIN_WORDS} words:`);
  for (const s of shallow) console.error(`  - ${s}`);
  process.exit(1);
}
console.log(`All posts meet the ${MIN_WORDS}-word minimum.`);