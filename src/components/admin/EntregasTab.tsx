import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  deleteDeliveryZone,
  getAdminDeliveryZones,
  upsertDeliveryZone,
  type AdminDeliveryZone,
} from "@/lib/admin.server";

const inputClass =
  "w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm text-foreground focus:border-ring focus:ring-1 focus:ring-ring focus:outline-none";

interface ZoneDraft {
  id?: string;
  bairro: string;
  taxa: string;
  tempo: string;
  ativo: boolean;
}

function toDraft(zone: AdminDeliveryZone): ZoneDraft {
  return { id: zone.id, bairro: zone.bairro, taxa: String(zone.taxa), tempo: zone.tempo ?? "", ativo: zone.ativo };
}

const NEW_ZONE_DRAFT: ZoneDraft = { bairro: "", taxa: "0", tempo: "5 dias úteis", ativo: true };

export function EntregasTab({ accessToken }: { accessToken: string }) {
  const [zones, setZones] = useState<AdminDeliveryZone[] | null>(null);
  const [drafts, setDrafts] = useState<Record<string, ZoneDraft>>({});
  const [newZone, setNewZone] = useState<ZoneDraft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  function load() {
    getAdminDeliveryZones({ data: { accessToken } })
      .then((rows) => {
        setZones(rows);
        setDrafts(Object.fromEntries(rows.map((z) => [z.id, toDraft(z)])));
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Erro ao carregar bairros."));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  function updateDraft(id: string, patch: Partial<ZoneDraft>) {
    setDrafts((current) => ({ ...current, [id]: { ...current[id]!, ...patch } }));
  }

  async function saveZone(id: string, draft: ZoneDraft) {
    setSavingId(id);
    setError(null);
    try {
      await upsertDeliveryZone({
        data: {
          accessToken,
          id: draft.id,
          bairro: draft.bairro,
          taxa: Number(draft.taxa) || 0,
          tempo: draft.tempo || undefined,
          ativo: draft.ativo,
        },
      });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar o bairro.");
    } finally {
      setSavingId(null);
    }
  }

  async function toggleActive(zone: AdminDeliveryZone) {
    const draft = drafts[zone.id];
    if (!draft) return;
    const next = { ...draft, ativo: !draft.ativo };
    updateDraft(zone.id, { ativo: next.ativo });
    await saveZone(zone.id, next);
  }

  async function removeZone(id: string) {
    if (!window.confirm("Excluir esse bairro? Isso não afeta pedidos já feitos.")) return;
    setSavingId(id);
    try {
      await deleteDeliveryZone({ data: { accessToken, id } });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível excluir o bairro.");
    } finally {
      setSavingId(null);
    }
  }

  async function createZone() {
    if (!newZone) return;
    setSavingId("new");
    setError(null);
    try {
      await upsertDeliveryZone({
        data: {
          accessToken,
          bairro: newZone.bairro,
          taxa: Number(newZone.taxa) || 0,
          tempo: newZone.tempo || undefined,
          ativo: newZone.ativo,
        },
      });
      setNewZone(null);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível criar o bairro.");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-lg font-bold text-foreground">Entregas</h2>
        <button
          type="button"
          onClick={() => setNewZone({ ...NEW_ZONE_DRAFT })}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-bold tracking-wide text-primary-foreground uppercase transition-colors hover:bg-primary/90"
        >
          <Plus className="h-3.5 w-3.5" />
          Adicionar bairro
        </button>
      </div>

      {error ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
          {error}
        </p>
      ) : null}

      {!zones ? (
        <p className="text-sm text-muted-foreground">Carregando bairros...</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {newZone ? (
            <div className="space-y-3 rounded-2xl border-2 border-dashed border-primary/40 bg-card p-4">
              <input
                type="text"
                placeholder="Nome do bairro"
                value={newZone.bairro}
                onChange={(e) => setNewZone({ ...newZone, bairro: e.target.value })}
                className={inputClass}
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="Taxa"
                  value={newZone.taxa}
                  onChange={(e) => setNewZone({ ...newZone, taxa: e.target.value })}
                  className={inputClass}
                />
                <input
                  type="text"
                  placeholder="5 dias úteis"
                  value={newZone.tempo}
                  onChange={(e) => setNewZone({ ...newZone, tempo: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={createZone}
                  disabled={!newZone.bairro || savingId === "new"}
                  className="flex-1 rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground uppercase disabled:opacity-60"
                >
                  Salvar
                </button>
                <button
                  type="button"
                  onClick={() => setNewZone(null)}
                  className="rounded-full border border-border px-4 py-2 text-xs font-bold text-muted-foreground uppercase"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : null}

          {zones.map((zone) => {
            const draft = drafts[zone.id] ?? toDraft(zone);
            return (
              <div key={zone.id} className="space-y-3 rounded-2xl border border-border bg-card p-4">
                <div className="flex items-center justify-between gap-2">
                  <input
                    type="text"
                    value={draft.bairro}
                    onChange={(e) => updateDraft(zone.id, { bairro: e.target.value })}
                    onBlur={() => saveZone(zone.id, drafts[zone.id]!)}
                    className={`${inputClass} font-semibold`}
                  />
                  <button
                    type="button"
                    onClick={() => removeZone(zone.id)}
                    aria-label={`Excluir ${zone.bairro}`}
                    className="shrink-0 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <label className="space-y-1">
                    <span className="text-[0.65rem] font-bold tracking-wide text-muted-foreground uppercase">
                      Taxa (R$)
                    </span>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={draft.taxa}
                      onChange={(e) => updateDraft(zone.id, { taxa: e.target.value })}
                      onBlur={() => saveZone(zone.id, drafts[zone.id]!)}
                      className={inputClass}
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-[0.65rem] font-bold tracking-wide text-muted-foreground uppercase">
                      Tempo
                    </span>
                    <input
                      type="text"
                      placeholder="5 dias úteis"
                      value={draft.tempo}
                      onChange={(e) => updateDraft(zone.id, { tempo: e.target.value })}
                      onBlur={() => saveZone(zone.id, drafts[zone.id]!)}
                      className={inputClass}
                    />
                  </label>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">
                    {draft.ativo ? "Ativo" : "Inativo"}
                  </span>
                  <Switch
                    checked={draft.ativo}
                    disabled={savingId === zone.id}
                    onCheckedChange={() => toggleActive(zone)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
