import Link from "next/link";
import { client } from "@/sanity/lib/client";
import { requireUser } from "@/lib/requireUser";
import AddVehicleServiceForm from "@/app/components/AddVehicleServiceForm";
import { serviceTypeLabel } from "@/lib/serviceImport";

type VehicleServicesPageData = {
  _id: string;
  name: string;
  odometer?: number;
  services: {
    _id: string;
    serviceType?: string;
    title: string;
    description?: string;
    date: string;
    odometer?: number;
    cost?: number;
    currency?: string;
  }[];
};

export default async function VehicleServicesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { userId } = await requireUser();
  const { id } = await params;

  const vehicle: VehicleServicesPageData | null = await client.fetch(
    `*[_type == "car" && _id == $id && owner._ref == $userId][0]{
      _id,
      name,
      odometer,
      "services": *[_type == "serviceRecord" && car._ref == $id && user._ref == $userId] | order(date desc){
        _id,
        serviceType,
        title,
        description,
        date,
        odometer,
        cost,
        currency
      }
    }`,
    { id, userId }
  );

  if (!vehicle) {
    return (
      <section className="main">
        <div className="rounded-lg border border-[color:var(--border)] bg-white p-6 text-sm text-[color:var(--muted)]">
          Vehicle not found.
        </div>
      </section>
    );
  }

  return (
    <section className="main">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="heading text-left">Vehicle Services</h1>
          <p className="text-sm text-[color:var(--muted)]">
            Track service history and costs for {vehicle.name}.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/import/services" className="button w-auto">
            <button className="btn min-w-30">Uvozi servis</button>
          </Link>
          <Link href={`/api/vehicle/${id}/services/pdf`} className="button w-auto">
            <button className="btn min-w-30">Izvozi PDF</button>
          </Link>
          <Link href={`/vehicle/${id}`} className="button w-auto">
            <button className="btn min-w-30">Nazaj na vozilo</button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-lg border border-[color:var(--border)] bg-white p-5 shadow-sm">
          <div className="mb-4 text-sm font-semibold">Add service</div>
          <AddVehicleServiceForm carId={id} currentOdometer={vehicle.odometer} />
        </div>

        <div className="rounded-lg border border-[color:var(--border)] bg-white p-5 shadow-sm">
          <div className="mb-4 text-sm font-semibold">Service history</div>
          {vehicle.services.length === 0 ? (
            <p className="text-sm text-[color:var(--muted)]">
              No service records yet for this vehicle.
            </p>
          ) : (
            <div className="grid gap-3">
              {vehicle.services.map((service) => (
                <div key={service._id} className="rounded-lg border border-[color:var(--border)] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="font-medium text-black">{service.title}</div>
                      {service.serviceType && (
                        <div className="mt-1 text-sm text-[color:var(--muted)]">
                          {serviceTypeLabel[service.serviceType] ?? service.serviceType}
                        </div>
                      )}
                    </div>
                    <div className="text-sm text-[color:var(--muted)]">
                      {new Date(service.date).toLocaleString("sl-SI")}
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-4 text-sm text-[color:var(--muted)]">
                    <span>
                      Odometer: {typeof service.odometer === "number" ? service.odometer.toLocaleString("sl-SI") : "-"} km
                    </span>
                    <span>
                      Cost: {typeof service.cost === "number" ? `${service.cost.toFixed(2)} ${service.currency ?? "EUR"}` : "-"}
                    </span>
                  </div>
                  {service.description && (
                    <p className="mt-2 text-sm text-[color:var(--muted)]">{service.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
