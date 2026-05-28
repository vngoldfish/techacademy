export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <h1 className="text-4xl font-bold text-gray-900">
        Học lập trình cùng <span className="text-blue-600">TechAcademy</span>
      </h1>
      <p className="mt-4 text-lg text-gray-600">
        Nền tảng học trực tuyến với video on-demand, quiz, và hệ thống credit linh hoạt.
      </p>
      <div className="mt-8">
        <a href="/courses" className="rounded-md bg-blue-600 px-6 py-3 text-lg font-medium text-white hover:bg-blue-700">
          Khám phá khóa học
        </a>
      </div>
    </div>
  );
}
