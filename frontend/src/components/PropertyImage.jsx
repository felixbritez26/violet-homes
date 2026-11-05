import { useState } from "react";
export default function PropertyImage({ item }) {
  const [failed, setFailed] = useState(false);
  // Same coordinates share a sample image across MLS feeds.
  const index =
    (Math.abs(
      Math.round(item.latitude * 10000) + Math.round(item.longitude * 10000),
    ) %
      3) +
    1;
  return (
    <>
      {!failed ? (
        <img
          className="property-photo"
          src={`/images/home-${index}.jpg`}
          alt="Illustrative house exterior; not a photograph of this listing"
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="house">
          <div className="roof" />
          <div className="walls">
            <i />
            <i />
            <b />
          </div>
        </div>
      )}
      <span className="photo-disclaimer">Sample photo</span>
    </>
  );
}
