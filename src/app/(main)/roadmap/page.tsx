import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const paths = [
  {
    title: "Frontend Developer",
    level: "Beginner → Intermediate",
    description: "Lộ trình cho người muốn xây dựng giao diện web chuyên nghiệp.",
    steps: ["HTML/CSS", "JavaScript", "TypeScript", "React", "Next.js", "Deploy"],
  },
  {
    title: "Fullstack Developer",
    level: "Intermediate",
    description: "Từ frontend đến backend, database, authentication và deployment.",
    steps: ["Frontend", "Node.js", "PostgreSQL", "Prisma", "Auth.js", "Stripe", "Vercel"],
  },
  {
    title: "EdTech Builder",
    level: "Project-based",
    description: "Xây dựng nền tảng học trực tuyến: khóa học, video, quiz, payment, admin.",
    steps: ["Next.js", "Prisma", "Auth.js", "Video Player", "Quiz", "Wallet", "Admin Panel"],
  },
];

export default function RoadmapPage() {
  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mx-auto max-w-3xl text-center">
        <Badge variant="secondary">Learning Roadmap</Badge>
        <h1 className="mt-4 text-4xl font-bold text-gray-900">Lộ trình học lập trình</h1>
        <p className="mt-4 text-lg text-gray-600">
          Chọn lộ trình phù hợp với mục tiêu của bạn và học theo từng bước rõ ràng.
        </p>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        {paths.map((path) => (
          <Card key={path.title} className="flex flex-col">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle>{path.title}</CardTitle>
                <Badge>{path.level}</Badge>
              </div>
              <p className="text-sm text-gray-500">{path.description}</p>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col">
              <div className="space-y-3">
                {path.steps.map((step, index) => (
                  <div key={step} className="flex items-center gap-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-600">
                      {index + 1}
                    </div>
                    <span className="text-sm font-medium text-gray-800">{step}</span>
                    {index < path.steps.length - 1 && <ArrowRight className="ml-auto h-4 w-4 text-gray-300" />}
                    {index === path.steps.length - 1 && <CheckCircle2 className="ml-auto h-4 w-4 text-green-500" />}
                  </div>
                ))}
              </div>
              <a href="/courses" className="mt-6">
                <Button className="w-full">Xem khóa học phù hợp</Button>
              </a>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
