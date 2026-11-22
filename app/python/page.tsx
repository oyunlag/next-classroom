import type { Metadata } from "next";
import PythonLab from "@/components/python/PythonLab";

export const metadata: Metadata = {
  title: "КодЛаб · Python",
  description:
    "Суурь дасгал, 10-р ангийн 30 нэгдсэн бодлого, мэдлэгийн сорил, чөлөөт код.",
};

export default function PythonPage() {
  return <PythonLab />;
}
