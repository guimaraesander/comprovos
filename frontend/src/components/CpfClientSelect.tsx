import Select, { components, type SingleValue } from "react-select";
import type { Client } from "../services/clients";

type Option = {
  value: string; // clientId
  label: string; // CPF/CNPJ (somente)
  client: Client;
};

function onlyDigits(s: string) {
  return (s || "").replace(/\D/g, "");
}

function formatCpfCnpj(value: string) {
  const d = onlyDigits(value);

  // CPF
  if (d.length === 11) {
    return d.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
  }

  // CNPJ
  if (d.length === 14) {
    return d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
  }

  return value;
}

const OptionRow = (props: any) => {
  // não mostra nome na lista — só CPF/CNPJ
  return (
    <components.Option {...props}>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <div style={{ fontWeight: 700 }}>{props.data.label}</div>
      </div>
    </components.Option>
  );
};

type Props = {
  clients: Client[];
  valueClientId: string;
  onChangeClient: (client: Client | null) => void;
  isDisabled?: boolean;
};

export function CpfClientSelect({ clients, valueClientId, onChangeClient, isDisabled }: Props) {
  const options: Option[] = (clients || [])
    .filter((c: any) => (c as any)?.cpfCnpj && String((c as any).cpfCnpj).trim().length > 0)
    .map((c: any) => {
      const cpf = String((c as any).cpfCnpj || "").trim();
      return {
        value: c.id,
        label: formatCpfCnpj(cpf),
        client: c,
      };
    });

  const selected = options.find((o) => o.value === valueClientId) ?? null;

  function handleChange(opt: SingleValue<Option>) {
    onChangeClient(opt ? opt.client : null);
  }

  return (
    <Select
      value={selected}
      options={options}
      onChange={handleChange}
      isClearable
      isDisabled={isDisabled}
      placeholder="Digite o CPF/CNPJ para buscar..."
      noOptionsMessage={() => "Nenhum CPF/CNPJ encontrado"}
      filterOption={(candidate, input) => {
        const needle = onlyDigits(input);
        const hay = onlyDigits(candidate.label);
        if (!needle) return true;
        return hay.includes(needle);
      }}
      components={{ Option: OptionRow }}
      styles={{
        control: (base, state) => ({
          ...base,
          minHeight: 40,
          borderRadius: 10,
          borderColor: state.isFocused ? "rgba(23,92,211,0.55)" : "rgba(0,0,0,0.12)",
          boxShadow: state.isFocused ? "0 0 0 3px rgba(23,92,211,0.15)" : "none",
        }),
        menu: (base) => ({ ...base, borderRadius: 12, overflow: "hidden" }),
        option: (base, state) => ({
          ...base,
          backgroundColor: state.isFocused ? "rgba(23,92,211,0.08)" : "white",
          color: "#101828",
        }),
      }}
    />
  );
}