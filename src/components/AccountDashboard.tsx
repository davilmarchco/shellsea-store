import { useEffect, useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { LogOut, MapPin, Package, User as UserIcon } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { SiteFooter } from "@/components/SiteFooter";

const inputClass =
  "w-full rounded-md border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring focus:outline-none disabled:cursor-not-allowed disabled:opacity-60";
const labelClass = "text-xs font-semibold tracking-wide text-muted-foreground uppercase";
const cardClass = "rounded-3xl border border-border bg-card p-6 sm:p-8";

/** Renders once the caller has confirmed `session` is present. */
export function AccountDashboard() {
  const { session, profile, signOut, refreshProfile } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-5 sm:px-6">
          <Link
            to="/"
            className="text-lg font-extrabold tracking-[0.15em] text-foreground sm:text-xl"
          >
            SHELL SEA
          </Link>
          <button
            type="button"
            onClick={() => void signOut()}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-destructive"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-8 px-4 py-10 sm:px-6 sm:py-14">
        <div>
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Área da cliente
          </p>
          <h1 className="mt-1 font-heading text-2xl font-bold text-foreground sm:text-3xl">
            Olá, {profile?.full_name?.split(" ")[0] || "bem-vinda"}!
          </h1>
        </div>

        <section className={cardClass}>
          <div className="mb-6 flex items-center gap-2">
            <UserIcon className="h-4 w-4 text-coral" />
            <h2 className="font-heading text-sm font-bold tracking-[0.1em] text-foreground uppercase">
              Meus dados
            </h2>
          </div>
          <ProfileForm
            email={session?.user.email ?? ""}
            userId={session?.user.id ?? ""}
            fullName={profile?.full_name ?? ""}
            phone={profile?.phone ?? ""}
            onSaved={refreshProfile}
          />
        </section>

        <section className={cardClass}>
          <div className="mb-6 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-coral" />
            <h2 className="font-heading text-sm font-bold tracking-[0.1em] text-foreground uppercase">
              Endereço de entrega
            </h2>
          </div>
          <AddressForm
            userId={session?.user.id ?? ""}
            initial={{
              address_zip: profile?.address_zip ?? "",
              address_street: profile?.address_street ?? "",
              address_number: profile?.address_number ?? "",
              address_complement: profile?.address_complement ?? "",
              address_neighborhood: profile?.address_neighborhood ?? "",
              address_city: profile?.address_city ?? "",
              address_state: profile?.address_state ?? "",
            }}
            onSaved={refreshProfile}
          />
        </section>

        <section className={cardClass}>
          <div className="mb-6 flex items-center gap-2">
            <Package className="h-4 w-4 text-coral" />
            <h2 className="font-heading text-sm font-bold tracking-[0.1em] text-foreground uppercase">
              Meus pedidos
            </h2>
          </div>
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <Package className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Você ainda não fez nenhum pedido. Suas compras aparecerão aqui.
            </p>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

function ProfileForm({
  email,
  userId,
  fullName,
  phone,
  onSaved,
}: {
  email: string;
  userId: string;
  fullName: string;
  phone: string;
  onSaved: () => Promise<void>;
}) {
  const [name, setName] = useState(fullName);
  const [phoneValue, setPhoneValue] = useState(phone);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");

  useEffect(() => setName(fullName), [fullName]);
  useEffect(() => setPhoneValue(phone), [phone]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!supabase || !userId) return;
    setSaving(true);
    setStatus("idle");
    const { error } = await supabase
      .from("customers")
      .update({ full_name: name, phone: phoneValue || null })
      .eq("id", userId);
    setSaving(false);
    if (error) {
      setStatus("error");
      return;
    }
    await onSaved();
    setStatus("saved");
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
      <label className="space-y-1.5 sm:col-span-1">
        <span className={labelClass}>Nome</span>
        <input
          type="text"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          className={inputClass}
        />
      </label>
      <label className="space-y-1.5 sm:col-span-1">
        <span className={labelClass}>E-mail</span>
        <input type="email" value={email} disabled className={inputClass} />
      </label>
      <label className="space-y-1.5 sm:col-span-1">
        <span className={labelClass}>Celular (WhatsApp)</span>
        <input
          type="tel"
          value={phoneValue}
          onChange={(event) => setPhoneValue(event.target.value)}
          className={inputClass}
        />
      </label>

      <div className="flex items-center gap-3 sm:col-span-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-primary px-6 py-2.5 text-xs font-bold tracking-[0.05em] text-primary-foreground uppercase transition-colors hover:bg-primary/90 disabled:opacity-60"
        >
          {saving ? "Salvando..." : "Salvar alterações"}
        </button>
        {status === "saved" ? (
          <span className="text-xs font-semibold text-pix">Dados atualizados!</span>
        ) : null}
        {status === "error" ? (
          <span className="text-xs font-semibold text-destructive">
            Não foi possível salvar. Tente novamente.
          </span>
        ) : null}
      </div>
    </form>
  );
}

interface AddressValues {
  address_zip: string;
  address_street: string;
  address_number: string;
  address_complement: string;
  address_neighborhood: string;
  address_city: string;
  address_state: string;
}

function AddressForm({
  userId,
  initial,
  onSaved,
}: {
  userId: string;
  initial: AddressValues;
  onSaved: () => Promise<void>;
}) {
  const [values, setValues] = useState<AddressValues>(initial);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");

  useEffect(() => setValues(initial), [initial]);

  function update<K extends keyof AddressValues>(key: K, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!supabase || !userId) return;
    setSaving(true);
    setStatus("idle");
    const { error } = await supabase
      .from("customers")
      .update({
        address_zip: values.address_zip || null,
        address_street: values.address_street || null,
        address_number: values.address_number || null,
        address_complement: values.address_complement || null,
        address_neighborhood: values.address_neighborhood || null,
        address_city: values.address_city || null,
        address_state: values.address_state || null,
      })
      .eq("id", userId);
    setSaving(false);
    if (error) {
      setStatus("error");
      return;
    }
    await onSaved();
    setStatus("saved");
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-6">
      <label className="space-y-1.5 sm:col-span-2">
        <span className={labelClass}>CEP</span>
        <input
          type="text"
          value={values.address_zip}
          onChange={(event) => update("address_zip", event.target.value)}
          className={inputClass}
        />
      </label>
      <label className="space-y-1.5 sm:col-span-4">
        <span className={labelClass}>Rua</span>
        <input
          type="text"
          value={values.address_street}
          onChange={(event) => update("address_street", event.target.value)}
          className={inputClass}
        />
      </label>
      <label className="space-y-1.5 sm:col-span-2">
        <span className={labelClass}>Número</span>
        <input
          type="text"
          value={values.address_number}
          onChange={(event) => update("address_number", event.target.value)}
          className={inputClass}
        />
      </label>
      <label className="space-y-1.5 sm:col-span-4">
        <span className={labelClass}>Complemento</span>
        <input
          type="text"
          value={values.address_complement}
          onChange={(event) => update("address_complement", event.target.value)}
          className={inputClass}
        />
      </label>
      <label className="space-y-1.5 sm:col-span-2">
        <span className={labelClass}>Bairro</span>
        <input
          type="text"
          value={values.address_neighborhood}
          onChange={(event) => update("address_neighborhood", event.target.value)}
          className={inputClass}
        />
      </label>
      <label className="space-y-1.5 sm:col-span-3">
        <span className={labelClass}>Cidade</span>
        <input
          type="text"
          value={values.address_city}
          onChange={(event) => update("address_city", event.target.value)}
          className={inputClass}
        />
      </label>
      <label className="space-y-1.5 sm:col-span-1">
        <span className={labelClass}>UF</span>
        <input
          type="text"
          maxLength={2}
          value={values.address_state}
          onChange={(event) => update("address_state", event.target.value.toUpperCase())}
          className={inputClass}
        />
      </label>

      <div className="flex items-center gap-3 sm:col-span-6">
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-primary px-6 py-2.5 text-xs font-bold tracking-[0.05em] text-primary-foreground uppercase transition-colors hover:bg-primary/90 disabled:opacity-60"
        >
          {saving ? "Salvando..." : "Salvar endereço"}
        </button>
        {status === "saved" ? (
          <span className="text-xs font-semibold text-pix">Endereço atualizado!</span>
        ) : null}
        {status === "error" ? (
          <span className="text-xs font-semibold text-destructive">
            Não foi possível salvar. Tente novamente.
          </span>
        ) : null}
      </div>
    </form>
  );
}
