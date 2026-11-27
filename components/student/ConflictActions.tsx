"use client";

export default function ConflictActions({
  onDownload,
  onOpenServerCopy,
}: {
  onDownload: () => void;
  onOpenServerCopy: () => void;
}) {
  return (
    <>
      <button type="button" onClick={onDownload}>
        Хадгалаагүй ажлаа татах
      </button>
      <button type="button" onClick={onOpenServerCopy}>
        Серверийн хувилбарыг нээх
      </button>
    </>
  );
}
