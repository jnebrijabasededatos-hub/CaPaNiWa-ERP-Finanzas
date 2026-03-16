import React, { useState, useEffect } from "react";
import axios from "axios";
import * as XLSX from "xlsx";

const API = "http://localhost:5002/api/finanzas";

export default function App() {
  const [vista, setVista] = useState("dashboard");
  const [facturas, setFacturas] = useState([]);
  const [balance, setBalance] = useState({ ingresos: 0, gastos: 0, ebitda: 0 });
  const [form, setForm] = useState({
    empresa: "",
    clienteNombre: "",
    monto: "",
    cuenta: "700",
  });
  const [busqueda, setBusqueda] = useState("");
  const [ai, setAi] = useState("🤖 Gemini CFO: Listo para analizar.");

  const cargarDatos = async () => {
    try {
      const resFacturas = await axios.get(`${API}/facturas`);
      const resBalance = await axios.get(`${API}/balance`);
      setFacturas(resFacturas.data);
      setBalance(resBalance.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const registrar = async (tipo) => {
    if (!form.empresa || !form.monto) return alert("Completa los datos");
    const montoFinal =
      tipo === "gasto"
        ? -Math.abs(Number(form.monto))
        : Math.abs(Number(form.monto));
    await axios.post(`${API}/facturas-manual`, { ...form, monto: montoFinal });
    setForm({ empresa: "", clienteNombre: "", monto: "", cuenta: "700" });
    cargarDatos();
  };

  const pagarFactura = async (id) => {
    await axios.put(`${API}/pagar/${id}`);
    cargarDatos();
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(facturas);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Contabilidad");
    XLSX.writeFile(wb, "ERP_CaPaNiWa_Finanzas.xlsx");
  };

  const analizarIA = async (txt) => {
    if (!txt) return;
    setAi("🤖 Procesando...");
    try {
      const res = await axios.post(`${API}/ai-gemini`, { pregunta: txt });
      setAi(res.data.respuesta);
    } catch (err) {
      setAi("❌ Error de conexión.");
    }
  };

  const filtradas = facturas.filter((f) =>
    f.empresa?.toLowerCase().includes(busqueda.toLowerCase()),
  );

  return (
    <div className="erp">
      <aside className="sidebar">
        <h2 className="brand">
          CPNW <span>FINANCE</span>
        </h2>
        <nav>
          <button
            className={vista === "dashboard" ? "active" : ""}
            onClick={() => setVista("dashboard")}
          >
            📊 Dashboard BI
          </button>
          <button
            className={vista === "operaciones" ? "active" : ""}
            onClick={() => setVista("operaciones")}
          >
            🧾 Facturación / AP
          </button>
          <button
            className={vista === "mayor" ? "active" : ""}
            onClick={() => setVista("mayor")}
          >
            📖 Libro Mayor
          </button>
          <button
            className={vista === "balance_sit" ? "active" : ""}
            onClick={() => setVista("balance_sit")}
          >
            ⚖️ Balance Situación
          </button>
        </nav>
        <div className="ai-box">
          <p>{ai}</p>
          <input
            placeholder="Pregunta al Copiloto..."
            onKeyDown={(e) => e.key === "Enter" && analizarIA(e.target.value)}
          />
        </div>
      </aside>

      <main className="main">
        <header>
          <input
            className="search"
            placeholder="Buscar empresa..."
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <button className="btn-excel" onClick={exportExcel}>
            📥 Descargar Reporte .XLSX
          </button>
        </header>

        {vista === "dashboard" && (
          <div className="grid">
            <div className="card">
              <h3>Ingresos</h3>
              <p className="text-exito">{balance.ingresos} €</p>
            </div>
            <div className="card">
              <h3>Gastos</h3>
              <p className="text-peligro">{balance.gastos} €</p>
            </div>
            <div className="card">
              <h3>EBITDA</h3>
              <p>
                <b>{balance.ebitda} €</b>
              </p>
            </div>
          </div>
        )}

        {vista === "balance_sit" && (
          <div className="balance-grid">
            <div className="card">
              <h3 className="line-green">ACTIVO</h3>
              <div className="b-row">
                <span>Bancos (572)</span> <b>{balance.ebitda} €</b>
              </div>
              <div className="b-row total">
                <span>TOTAL ACTIVO</span> <b>{balance.ebitda} €</b>
              </div>
            </div>
            <div className="card">
              <h3 className="line-blue">PASIVO Y PATRIMONIO</h3>
              <div className="b-row">
                <span>Resultado Ejercicio (129)</span> <b>{balance.ebitda} €</b>
              </div>
              <div className="b-row total">
                <span>TOTAL PASIVO</span> <b>{balance.ebitda} €</b>
              </div>
            </div>
          </div>
        )}

        {vista === "operaciones" && (
          <div className="card form-container">
            <h3>Nueva Operación</h3>
            <div className="inputs">
              <input
                placeholder="Empresa"
                value={form.empresa}
                onChange={(e) => setForm({ ...form, empresa: e.target.value })}
              />
              <input
                placeholder="Nombre Cliente"
                value={form.clienteNombre}
                onChange={(e) =>
                  setForm({ ...form, clienteNombre: e.target.value })
                }
              />
              <input
                type="number"
                placeholder="Monto"
                value={form.monto}
                onChange={(e) => setForm({ ...form, monto: e.target.value })}
              />
              <select
                onChange={(e) => setForm({ ...form, cuenta: e.target.value })}
              >
                <option value="700">700 - Ventas</option>
                <option value="600">600 - Compras</option>
                <option value="629">629 - Gastos Varios</option>
              </select>
            </div>
            <div className="buttons">
              <button className="ingreso" onClick={() => registrar("ingreso")}>
                Emitir Ingreso (+)
              </button>
              <button className="gasto" onClick={() => registrar("gasto")}>
                Registrar Pago (-)
              </button>
            </div>
          </div>
        )}

        {vista === "mayor" && (
          <div className="card">
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Hash</th>
                  <th>Empresa</th>
                  <th>Debe</th>
                  <th>Haber</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtradas.map((f) => (
                  <tr key={f._id}>
                    <td>{new Date(f.fecha).toLocaleDateString()}</td>
                    <td>
                      <small className="hash">{f.hash_verifactu}</small>
                    </td>
                    <td>{f.empresa}</td>
                    <td className="text-exito">
                      {f.monto > 0 ? f.monto + " €" : "-"}
                    </td>
                    <td className="text-peligro">
                      {f.monto < 0 ? Math.abs(f.monto) + " €" : "-"}
                    </td>
                    <td>
                      <span
                        className={
                          f.estado === "Pagada" ? "pill-ok" : "pill-pending"
                        }
                      >
                        {f.estado}
                      </span>
                    </td>
                    <td>
                      {f.estado === "Pendiente" && (
                        <button onClick={() => pagarFactura(f._id)}>
                          Conciliar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      <style>{`
        body { margin: 0; background: #f1f5f9; font-family: 'Segoe UI', sans-serif; }
        .erp { display: flex; height: 100vh; }
        .sidebar { width: 260px; background: #0f172a; color: white; padding: 25px; display: flex; flex-direction: column; }
        .brand span { color: #3b82f6; }
        nav button { width: 100%; padding: 12px; margin: 5px 0; background: transparent; border: none; color: #94a3b8; text-align: left; cursor: pointer; border-radius: 8px; }
        nav button.active { background: #2563eb; color: white; }
        .ai-box { margin-top: auto; background: #1e293b; padding: 15px; border-radius: 10px; font-size: 12px; color: #10b981; }
        .ai-box input { width: 100%; margin-top: 10px; padding: 8px; border-radius: 4px; border: none; background: #0f172a; color: white; box-sizing: border-box;}
        .main { flex: 1; padding: 30px; overflow-y: auto; }
        header { display: flex; justify-content: space-between; margin-bottom: 25px; }
        .search { width: 300px; padding: 10px; border-radius: 8px; border: 1px solid #ddd; }
        .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
        .card { background: white; padding: 20px; border-radius: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
        .erp-table { width: 100%; border-collapse: collapse; }
        th { text-align: left; color: #64748b; font-size: 12px; padding: 10px; border-bottom: 2px solid #f1f5f9; }
        td { padding: 12px 10px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
        .text-exito { color: #10b981; } .text-peligro { color: #ef4444; }
        .hash { font-family: monospace; color: #3b82f6; }
        .pill-ok { background: #dcfce7; color: #166534; padding: 4px 8px; border-radius: 12px; font-size: 11px; }
        .pill-pending { background: #fee2e2; color: #991b1b; padding: 4px 8px; border-radius: 12px; font-size: 11px; }
        .balance-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .b-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
        .total { font-weight: bold; border-top: 2px solid #0f172a; margin-top: 10px; }
        .line-green { border-bottom: 3px solid #10b981; } .line-blue { border-bottom: 3px solid #2563eb; }
        .inputs input, .inputs select { margin-bottom: 10px; width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; box-sizing: border-box;}
        .btn-excel { background: #0f172a; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; }
        .ingreso { background: #10b981; color: white; border: none; padding: 12px; border-radius: 8px; margin-right: 10px; cursor: pointer;}
        .gasto { background: #ef4444; color: white; border: none; padding: 12px; border-radius: 8px; cursor: pointer;}
      `}</style>
    </div>
  );
}
