import type { Metadata } from "next";
import PythonLab from "@/components/python/PythonLab";

export const metadata: Metadata = {
  title: "10-р анги · Python нэгдсэн дадлага · КодЛаб",
  description: "Хялбараас ахисан түвшин хүртэлх Python-ийн 30 бодлого.",
};

export default function Grade10PythonPage() {
  return <PythonLab grade10Practice />;
}
