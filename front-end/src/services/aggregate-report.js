export const reportTypes = {
  marcas: { key: "byMarca", field: "MARCA", label: "Marca", quantity: "Produtos cadastrados" },
  familias: { key: "byFamily", field: "FAMILIA", label: "Família", quantity: "Produtos cadastrados" },
  fornecedores: { key: "byFornecedor", field: "FORNECEDOR", label: "Fornecedor", quantity: "Quantidade em estoque" },
};
const number = value => Number.isFinite(Number(value)) ? Number(value) : 0;
export function aggregateRows(data, type) {
  const config = reportTypes[type];
  return (data?.[config.key] || []).map(item => ({
    name: String(item[config.field] ?? item[config.field.toLowerCase()] ?? ""),
    quantity: number(item.total),
    value: number(item.ValorTotalEstoque ?? item.valortotalestoque ?? item.valorTotalEstoque),
  }));
}
export function filterAggregateRows(rows, { search = "", minValue = "", order = "name" }) {
  const normalize = value => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");
  const term = normalize(search.trim());
  const minimum = minValue === "" ? -Infinity : number(minValue);
  return rows.filter(row => normalize(row.name).includes(term) && row.value >= minimum)
    .sort((a,b) => order === "value" ? b.value - a.value || a.name.localeCompare(b.name, "pt-BR")
      : order === "quantity" ? b.quantity - a.quantity || a.name.localeCompare(b.name, "pt-BR") : a.name.localeCompare(b.name, "pt-BR"));
}
export function aggregateCsv(rows, type) {
  const config = reportTypes[type];
  const cell = value => {
    let text = String(value ?? "");
    if (typeof value === "string" && /^[\s]*[=+\-@]/.test(text)) text = "'" + text;
    return '"' + text.replace(/"/g, '""') + '"';
  };
  return "\uFEFF" + [[config.label, config.quantity, "Valor total do estoque (R$)"],
    ...rows.map(row => [row.name, row.quantity, row.value.toFixed(2).replace(".", ",")])]
    .map(row => row.map(cell).join(";")).join("\r\n");
}
