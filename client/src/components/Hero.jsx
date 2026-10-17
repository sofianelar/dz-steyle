import { useSettings } from '../lib/useSettings';
export default function Hero() {
  const s = useSettings();
  const bg = s.hero_image ? { backgroundImage: `linear-gradient(rgba(0,0,0,.45),rgba(0,0,0,.45)),url(${s.hero_image})` } : {};
  return (<div className="hero" style={bg}>
    <h1>{s.hero_title || 'STAYEL DZ'}</h1>
    <p>{s.hero_subtitle || 'ملابس رجالية بأسلوب عصري'}</p>
    <a href="#products" className="btn light">{s.hero_button || 'تسوق الآن'}</a>
  </div>);
}
