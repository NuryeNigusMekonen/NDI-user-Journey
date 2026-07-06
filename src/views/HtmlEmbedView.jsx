export default function HtmlEmbedView({ file, title, className = '' }) {
  return (
    <iframe
      src={`${import.meta.env.BASE_URL}${file}`}
      title={title}
      className={`w-full h-full border-0 ${className}`}
      allow="fullscreen"
    />
  );
}
