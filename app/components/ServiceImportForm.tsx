"use client";

import { useMemo, useState, useTransition } from "react";
import { read, utils } from "xlsx";
import { importVehicleServices } from "@/app/(root)/import/services/action";
import {
  getServiceImportTemplateHeaders,
  normalizeImportedServiceRow,
  serviceTypeLabel,
  type ImportedServiceRow,
} from "@/lib/serviceImport";

type ServiceImportFormProps = {
  knownCars: {
    name: string;
    plate?: string;
    vin?: string;
  }[];
};

type ImportResultState = {
  success: boolean;
  error: string | null;
  importedCount: number;
  skippedCount: number;
  messages: string[];
} | null;

export default function ServiceImportForm({ knownCars }: ServiceImportFormProps) {
  const [rows, setRows] = useState<ImportedServiceRow[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const [parseError, setParseError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<ImportResultState>(null);
  const [isPending, startTransition] = useTransition();

  const invalidRows = useMemo(() => rows.filter((row) => row.errors.length > 0), [rows]);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    setImportResult(null);
    setParseError(null);
    setRows([]);
    setFileName(file?.name ?? "");

    if (!file) {
      return;
    }

    try {
      const buffer = await file.arrayBuffer();
      const workbook = read(buffer, { type: "array", raw: false, cellDates: false });
      const firstSheetName = workbook.SheetNames[0];

      if (!firstSheetName) {
        setParseError("The selected file does not contain any worksheet.");
        return;
      }

      const sheet = workbook.Sheets[firstSheetName];
      const rawRows = utils.sheet_to_json<Record<string, unknown>>(sheet, {
        defval: "",
        raw: false,
      });

      if (rawRows.length === 0) {
        setParseError("The selected file does not contain any data rows.");
        return;
      }

      setRows(rawRows.map((row, index) => normalizeImportedServiceRow(row, index + 2)));
    } catch (error) {
      console.error("PARSE SERVICE IMPORT FILE ERROR:", error);
      setParseError("Failed to read the selected CSV/XLSX file.");
    }
  }

  function handleImport() {
    if (rows.length === 0 || isPending) {
      return;
    }

    setImportResult(null);

    startTransition(async () => {
      const result = await importVehicleServices(rows);
      setImportResult(result);
    });
  }

  return (
    <div className="grid gap-6">
      <div className="rounded-lg border border-[color:var(--border)] bg-white p-5 shadow-sm">
        <div className="mb-2 text-sm font-semibold text-black">Uvozi servisne zapise</div>
        <p className="text-sm text-[color:var(--muted)]">
          Naloži <code>.csv</code> ali <code>.xlsx</code> datoteko z zgodovino servisiranja. Vozila so ujemanja po registrskih oznakah ali VIN številki.
        </p>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="grid gap-3">
            <label htmlFor="serviceImportFile" className="text-sm font-medium text-black">
              Izberi datoteko za uvoz
            </label>
            <input
              id="serviceImportFile"
              type="file"
              accept=".csv,.xlsx,.xls"
              className="authInput"
              onChange={handleFileChange}
            />
            <div className="text-xs text-[color:var(--muted)]">
              Expected columns: {getServiceImportTemplateHeaders().join(", ")}
            </div>
            {fileName && <div className="text-sm text-black">Selected file: {fileName}</div>}
            {parseError && <div className="text-sm text-red-500">{parseError}</div>}
          </div>

          <div className="rounded-lg border border-[color:var(--border)] bg-neutral-50 p-4">
            <div className="text-sm font-semibold text-black">Znana vozila</div>
            <div className="mt-3 grid gap-2 text-sm text-[color:var(--muted)]">
              {knownCars.length === 0 ? (
                <span>Še ni dodanih vozil.</span>
              ) : (
                knownCars.map((car) => (
                  <div key={`${car.plate ?? "-"}-${car.vin ?? "-"}`}>
                    <div className="text-black">{car.name}</div>
                    <div>Plate: {car.plate || "-"}</div>
                    <div>VIN: {car.vin || "-"}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {rows.length > 0 && (
        <div className="rounded-lg border border-[color:var(--border)] bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-black">Predogled uvoza</div>
              <div className="text-sm text-[color:var(--muted)]">
                {rows.length} vrstic oblikovanih, {invalidRows.length} vrstic potrebujejo pozornosti.
              </div>
            </div>
            <button
              type="button"
              className="buttonPrimary w-auto px-6"
              disabled={isPending}
              onClick={handleImport}
            >
              {isPending ? "Importing..." : "Import service records"}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-[color:var(--border)] text-left text-[color:var(--muted)]">
                  <th className="py-2 pr-4">Vrstica</th>
                  <th className="py-2 pr-4">Vozilo</th>
                  <th className="py-2 pr-4">Naslov</th>
                  <th className="py-2 pr-4">Tip</th>
                  <th className="py-2 pr-4">Datum</th>
                  <th className="py-2 pr-4">Stevilka</th>
                  <th className="py-2 pr-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 20).map((row) => (
                  <tr key={row.rowNumber} className="border-b border-[color:var(--border)] align-top">
                    <td className="py-3 pr-4 text-black">{row.rowNumber}</td>
                    <td className="py-3 pr-4 text-[color:var(--muted)]">
                      Plate: {row.plate || "-"}
                      <br />
                      VIN: {row.vin || "-"}
                    </td>
                    <td className="py-3 pr-4 text-black">{row.title || "-"}</td>
                    <td className="py-3 pr-4 text-[color:var(--muted)]">
                      {serviceTypeLabel[row.serviceType] ?? row.serviceType}
                    </td>
                    <td className="py-3 pr-4 text-[color:var(--muted)]">
                      {row.date ? new Date(row.date).toLocaleString("sl-SI") : "-"}
                    </td>
                    <td className="py-3 pr-4 text-[color:var(--muted)]">
                      {row.cost ? `${row.cost} ${row.currency}` : "-"}
                    </td>
                    <td className="py-3 pr-4">
                      {row.errors.length === 0 ? (
                        <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-800">Ready</span>
                      ) : (
                        <div className="grid gap-1">
                          {row.errors.map((error) => (
                            <span key={error} className="rounded-full bg-red-100 px-2 py-1 text-xs text-red-700">
                              {error}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {rows.length > 20 && (
            <div className="mt-3 text-xs text-[color:var(--muted)]">
              Prikazujem prve 20 oblikovanih vrstic. Celotna datoteka bo še vedno uvožena.
            </div>
          )}
        </div>
      )}

      {importResult && (
        <div className="rounded-lg border border-[color:var(--border)] bg-white p-5 shadow-sm">
          <div className="text-sm font-semibold text-black">Import result</div>
          <div className="mt-2 text-sm text-[color:var(--muted)]">
            Imported: {importResult.importedCount} | Skipped: {importResult.skippedCount}
          </div>
          {importResult.error && <div className="mt-2 text-sm text-red-500">{importResult.error}</div>}
          {importResult.messages.length > 0 && (
            <div className="mt-3 grid gap-2 text-sm text-[color:var(--muted)]">
              {importResult.messages.slice(0, 12).map((message) => (
                <div key={message}>{message}</div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
