import type { StudentProfile } from "./database";
import { schoolDay } from "./classroom";

export function classroomScope(groupId: string, teacherId: string) {
  return Buffer.from(JSON.stringify([groupId, teacherId])).toString(
    "base64url",
  );
}

export function classroomScopes(
  profile: Pick<StudentProfile, "groupId" | "teacherIds">,
) {
  const groupId = profile.groupId;
  return groupId && profile.teacherIds?.length
    ? profile.teacherIds.map((teacherId) => classroomScope(groupId, teacherId))
    : ["unassigned"];
}

/** Change roster membership and save the preceding assignment in the same write. */
export function membershipChange(
  fields: Partial<
    Pick<
      StudentProfile,
      | "groupId"
      | "name"
      | "notes"
      | "teacherIds"
      | "deletedAt"
      | "deletedBy"
      | "sourceId"
      | "updatedAt"
    >
  >,
  now: Date,
  { archive = false, restore = false, link = false } = {},
) {
  const day = schoolDay(now);
  const currentTeachers = { $ifNull: ["$teacherIds", []] };
  const currentGroup = { $ifNull: ["$groupId", null] };
  const changes = [
    ...(fields.groupId !== undefined
      ? [{ $ne: [currentGroup, { $literal: fields.groupId }] }]
      : []),
    ...(fields.teacherIds !== undefined
      ? [
          {
            $not: [
              {
                $setEquals: [currentTeachers, { $literal: fields.teacherIds }],
              },
            ],
          },
        ]
      : []),
    archive || restore,
  ];
  const changed = { $or: changes };
  const snapshot = {
    groupId: "$groupId",
    teacherIds: currentTeachers,
    name: "$name",
    since: { $ifNull: ["$classroomSince", null] },
    until: day,
  };
  return [
    {
      $set: {
        ...Object.fromEntries(
          Object.entries(fields).map(([key, value]) => [
            key,
            { $literal: value },
          ]),
        ),
        ...(restore ? { deletedAt: "$$REMOVE", deletedBy: "$$REMOVE" } : {}),
        ...(link ? { manualEnrollment: "$$REMOVE" } : {}),
        classroomHistory: {
          $cond: [
            {
              $and: [
                changed,
                { $eq: [{ $type: "$deletedAt" }, "missing"] },
                { $eq: [{ $type: "$groupId" }, "string"] },
              ],
            },
            {
              $concatArrays: [
                { $ifNull: ["$classroomHistory", []] },
                [snapshot],
              ],
            },
            "$classroomHistory",
          ],
        },
        classroomSince: { $cond: [changed, day, "$classroomSince"] },
      },
    },
  ];
}
