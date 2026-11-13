import type { Settlement } from "./types";

export function JobContact({
  contact,
  heading,
}: {
  contact: Settlement["contact"];
  heading: string;
}) {
  if (!contact) return null;
  return (
    <section className="my-4 space-y-1 text-sm wrap-anywhere" aria-label={heading}>
      <h3 className="font-semibold">{heading}</h3>
      <p>
        Email{" "}
        <a className="underline" href={`mailto:${contact.email}`}>
          {contact.email}
        </a>
      </p>
      {contact.phone && (
        <p>
          Phone{" "}
          <a className="underline" href={`tel:${contact.phone}`}>
            {contact.phone}
          </a>
        </p>
      )}
      {contact.line_id && <p>LINE {contact.line_id}</p>}
    </section>
  );
}
