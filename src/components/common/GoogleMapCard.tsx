interface GoogleMapCardProps {
  address: string;
  coordinates?: { lat: number; lng: number };
  mapUrl?: string;
  className?: string;
}

export default function GoogleMapCard({ address, coordinates, mapUrl, className }: GoogleMapCardProps) {
  const q = coordinates
    ? `${coordinates.lat},${coordinates.lng}`
    : encodeURIComponent(address?.trim() || "Byumba, Rwanda");
  const embedSrc = `https://maps.google.com/maps?q=${q}&z=17&output=embed`;
  const link =
    mapUrl || `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address?.trim() || q)}`;

  return (
    <div className={`map-card ${className ?? ""}`}>
      <div className="map-card-head">
        <div className="icon">
          <i className="fa-solid fa-location-dot" />
        </div>
        <div>
          <h4>Our Location</h4>
          <p>{address}</p>
        </div>
      </div>
      <div className="map-frame">
        <iframe
          title="CPEC Saint Babeth TSS — location map"
          src={embedSrc}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      </div>
      <a className="btn-outline map-directions" href={link} target="_blank" rel="noopener noreferrer">
        <i className="fa-solid fa-diamond-turn-right" /> Get Directions
      </a>
    </div>
  );
}
