import type { Metadata } from "next";
import { quizGrades } from "@/lib/curriculum/quiz-project";
import QuizProject from "./QuizProject";

export const metadata: Metadata = {
  title: "Ховор хариулт · JavaScript төсөл · КодЛаб",
  description:
    "6–8-р ангийн JavaScript төсөл. Онооны код бичиж, өөрийн асуултаар тоглоорой.",
};

export default async function QuizProjectPage({
  searchParams,
}: PageProps<"/quiz-project">) {
  const { grade } = await searchParams;
  const selected = quizGrades.find((value) => String(value) === grade) ?? 6;
  return <QuizProject key={selected} grade={selected} />;
}
