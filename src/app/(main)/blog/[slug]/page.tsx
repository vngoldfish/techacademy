import { notFound } from "next/navigation";
import { Calendar, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const posts = [
  {
    slug: "hoc-react-tu-dau",
    title: "Học React từ đâu để không bị ngợp?",
    category: "React",
    date: "28/05/2026",
    content: [
      "React không khó, nhưng dễ bị ngợp nếu học lan man. Cách học hiệu quả nhất là đi từ JavaScript nền tảng, sau đó chuyển sang component, props, state và hooks.",
      "Bạn nên bắt đầu bằng việc xây vài component nhỏ: Button, Card, TodoItem. Khi quen với props và state, hãy làm một project nhỏ như Todo App hoặc Course Listing.",
      "Sau React cơ bản, hãy học cách tổ chức component, form validation, data fetching và routing. Khi đó bạn sẽ sẵn sàng bước sang Next.js.",
    ],
  },
  {
    slug: "nextjs-app-router-la-gi",
    title: "Next.js App Router là gì?",
    category: "Next.js",
    date: "28/05/2026",
    content: [
      "App Router là hệ thống routing mới của Next.js, dựa trên thư mục `app/`. Mỗi thư mục đại diện cho một route, và `page.tsx` là UI của route đó.",
      "Điểm mạnh lớn nhất của App Router là Server Components. Bạn có thể query database trực tiếp trong server component mà không cần API trung gian cho nhiều trường hợp.",
      "Với project production, hãy tách route groups như `(auth)`, `(main)`, `admin`, và dùng loading/error boundaries để cải thiện UX.",
    ],
  },
  {
    slug: "xay-dung-edtech-platform",
    title: "Xây dựng EdTech Platform cần những gì?",
    category: "Product",
    date: "28/05/2026",
    content: [
      "Một EdTech Platform không chỉ là danh sách video. Nó cần course structure, lesson player, progress tracking, quiz, assignment, payment và admin panel.",
      "Phần khó thường nằm ở các flow liên kết với nhau: mua khóa học bằng credit, unlock bài học theo tiến độ, lưu ghi chú theo timestamp và chấm bài tập.",
      "Nếu xây MVP, hãy giữ scope gọn: video embed, quiz trắc nghiệm, Stripe Checkout, PostgreSQL, Prisma và admin CRUD cơ bản.",
    ],
  },
];

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function BlogDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const post = posts.find((item) => item.slug === slug);

  if (!post) notFound();

  return (
    <article className="container mx-auto max-w-3xl px-4 py-10">
      <a href="/blog" className="text-sm text-blue-600 hover:underline">
        ← Quay lại Blog
      </a>
      <div className="mt-6 flex items-center gap-3 text-sm text-gray-500">
        <Badge>{post.category}</Badge>
        <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> {post.date}</span>
        <span className="flex items-center gap-1"><Tag className="h-4 w-4" /> TechAcademy</span>
      </div>
      <h1 className="mt-4 text-4xl font-bold text-gray-900">{post.title}</h1>
      <Separator className="my-8" />
      <div className="space-y-5 text-lg leading-8 text-gray-700">
        {post.content.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
    </article>
  );
}
