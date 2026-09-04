interface SettingsMsgProps {
  text: string;
  type: "ok" | "err" | null;
}

export default function SettingsMsg({ text, type }: SettingsMsgProps) {
  return <div className={`sp-msg ${type ? `show ${type}` : ""}`}>{text}</div>;
}
