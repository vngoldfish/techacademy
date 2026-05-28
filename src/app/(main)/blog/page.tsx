import { Calendar, Tag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const posts = [
  {
    slug: "hoc-react-tu-dau",
    title: "Học React từ đâu để không bị ngợp?",
    category: "React",
    date: "28/05/2026",
    excerpt: "Lộ trình học React thực tế cho người mới: từ JavaScript nền tảng đến component, state, hooks và project thực hành.",
  },
  {
    slug: "nextjs-app-router-la-gi",
    title: "Next.js App Router là gì?",
    category: "Next.js",
    date: "28/05/2026",
    excerpt: "Tìm hiểu App Router, Server Components, route handlers và cách tổ chức project Next.js production-grade.",
  },
  {
    slug: "xay-dung-edtech-platform",
    title: "Xây dựng EdTech Platform cần những gì?",
    category: "Product",
    date: "28/05/2026",
    excerpt: "Các module quan trọng của một nền tảng học trực tuyến: course, video, quiz, payment, admin và analytics.",
  },
];

export default function BlogPage() {
  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-8">
        <Badge variant="secondary">TechAcademy Blog</Badge>
        <h1 className="mt-4 text-4xl font-bold text-gray-900">Blog lập trình & EdTech</h1>
        <p className="mt-3 max-w-2xl text-gray-600">
          Bài viết thực tế về học lập trình, xây dựng sản phẩm, Next.js, React và hệ thống học trực tuyến.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <Card key={post.slug} className="flex flex-col">
            <CardHeader>
              <div className="mb-3 flex items-center gap-2 text-xs text-gray-500">
                <Tag className="h-3 w-3" />
                <span>{post.category}</span>
                <Calendar className="ml-2 h-3 w-3" />
                <span>{post.date}</span>
              </div>
              <CardTitle className="line-clamp-2">{post.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col">
              <p className="flex-1 text-sm text-gray-600">{post.excerpt}</p>
              <a href={`/blog/${post.slug}`} className="mt-5">
                <Button variant="outline" className="w-full">Đọc bài viết</Button>
              </a>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
