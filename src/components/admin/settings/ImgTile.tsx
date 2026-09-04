import { useRef } from "react";

interface ImgTileProps {
  src: string;
  onChange: (dataUrl: string) => void;
}

export default function ImgTile({ src, onChange }: ImgTileProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => onChange(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <>
      <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFile} />
      <div className="img-tile" style={{ backgroundImage: `url('${src}')` }} onClick={() => fileRef.current?.click()}>
        <span className="img-tile-hint">
          <i className="fa-solid fa-camera" /> Click to change photo
        </span>
      </div>
    </>
  );
}
