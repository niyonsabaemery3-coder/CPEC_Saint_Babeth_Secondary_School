export default function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div className="field-error">
      <i className="fa-solid fa-circle-exclamation" /> {message}
    </div>
  );
}
