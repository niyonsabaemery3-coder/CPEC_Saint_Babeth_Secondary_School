interface FFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  multiline?: boolean;
}

export default function FField({ label, value, onChange, type = "text", multiline = false }: FFieldProps) {
  return (
    <div className="ffield always-float">
      {multiline ? (
        <textarea value={value} placeholder=" " onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input type={type} value={value} placeholder=" " onChange={(e) => onChange(e.target.value)} />
      )}
      <label>{label}</label>
    </div>
  );
}
