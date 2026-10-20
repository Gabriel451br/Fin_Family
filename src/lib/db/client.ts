import postgres from "postgres";

declare global {
  var __finFamilySql: ReturnType<typeof postgres> | undefined;
}

function createSqlClient() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL não configurada. Copie .env.example para .env.local e preencha a senha do banco.",
    );
  }
  return postgres(url, {
    prepare: false,
    ssl: "require",
    max: 10,
    types: {
      // devolve date/timestamp/timestamptz como string ISO em vez de objeto Date,
      // evitando conversões de fuso horário implícitas em todo o código.
      date: {
        to: 1082,
        from: [1082],
        serialize: (x: string) => x,
        parse: (x: string) => x,
      },
      timestamp: {
        to: 1114,
        from: [1114, 1184],
        serialize: (x: string) => x,
        parse: (x: string) => x,
      },
    },
  });
}

// Reaproveita a conexão entre hot-reloads em dev; em produção (serverless)
// cada instância cria a sua própria pool, dentro do limite do pooler.
export const sql = globalThis.__finFamilySql ?? createSqlClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__finFamilySql = sql;
}
