import { useSettings } from '../lib/useSettings';
export default function AnnouncementBar() {
  const { announcement } = useSettings();
  if (!announcement) return null;
  return <div className="annbar">{announcement}</div>;
}
