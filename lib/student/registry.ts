import { accountCollection } from "../admin/accounts";
import { normalizeTeacherName } from "./identity";

export async function teacherIdByName(value: string): Promise<string | null> {
  const name = normalizeTeacherName(value);
  if (!name) return null;
  const teachers = (await accountCollection())
    .find({ active: true })
    .project<{ _id: string; name: string }>({ _id: 1, name: 1 });
  let id: string | null = null;
  for await (const teacher of teachers) {
    if (normalizeTeacherName(teacher.name) !== name) continue;
    if (id !== null) return null;
    id = teacher._id;
  }
  return id;
}
