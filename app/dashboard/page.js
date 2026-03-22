"use client";
import { useEffect, useState, useMemo } from "react";
import * as XLSX from "xlsx";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    PointElement,
    LineElement,
    ArcElement
} from "chart.js";
import { Bar, Line, Pie } from "react-chartjs-2";
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, PointElement, LineElement, ArcElement);
import { useRouter } from "next/navigation";

export default function DashboardPage() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [data, setData] = useState(null);
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [period, setPeriod] = useState("all");
    const router = useRouter();

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch("/api/transactions/details", {
                    headers: {
                        "Content-Type": "application/json",
                    },
                    credentials: "include",
                });
                if (!res.ok) throw new Error("Error al obtener datos del dashboard");
                const json = await res.json();
                setData(json);
            } catch (err) {
                setError(err.message || "Error desconocido");
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    const metrics = useMemo(() => {
        if (!data || !Array.isArray(data)) return null;
        let transactions = data.map(t => ({
            ...t,
            total: parseFloat(t.total),
            date: new Date(t.date),
            details: t.details || [],
        }));
        const now = new Date();
        let from = null, to = null;
        if (period === "today") {
            from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        } else if (period === "week") {
            const day = now.getDay() || 7;
            from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day + 1);
            to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        } else if (period === "month") {
            from = new Date(now.getFullYear(), now.getMonth(), 1);
            to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        } else if (period === "range") {
            if (dateFrom) from = new Date(dateFrom);
            if (dateTo) {
                to = new Date(dateTo);
                to.setHours(23, 59, 59, 999);
            }
        }
        if (from) transactions = transactions.filter(t => t.date >= from);
        if (to) transactions = transactions.filter(t => t.date <= to);
        const totalTransactions = transactions.length;
        const totalAmount = transactions.reduce((acc, t) => acc + t.total, 0);
        const completedCount = transactions.filter(t => t.status === 'completed').length;
        const pendingCount = transactions.filter(t => t.status === 'pending').length;

        const byDay = {};
        transactions.forEach(t => {
            const key = t.date.toISOString().slice(0, 10);
            if (!byDay[key]) byDay[key] = { total: 0, count: 0 };
            byDay[key].total += t.total;
            byDay[key].count++;
        });
        const dayLabels = Object.keys(byDay).sort();
        const dayTotals = dayLabels.map(d => byDay[d].total);
        const dayCounts = dayLabels.map(d => byDay[d].count);
        const avgByDay = dayLabels.map(d => byDay[d].total / Math.max(byDay[d].count, 1));

        let runningTotal = 0;
        const accumulated = dayTotals.map(val => (runningTotal += val));

        const byHour = Array(24).fill(0);
        transactions.forEach(t => {
            const hour = t.date.getHours();
            byHour[hour] += t.total;
        });

        const byPayment = {};
        transactions.forEach(t => {
            const key = t.payment_method || 'Sin método';
            byPayment[key] = (byPayment[key] || 0) + t.total;
        });
        const paymentLabels = Object.keys(byPayment);
        const paymentTotals = paymentLabels.map(k => byPayment[k]);

        const byCategory = {};
        transactions.forEach(t => {
            t.details.forEach(d => {
                const normalizeCategory = (cat) => {
                    if (!cat) return 'Sin categoría';
                    if (cat === 'print') return 'Impresión';
                    if (cat === 'special_service') return 'Servicio especial';
                    if (cat === 'arte_y_diseno' || cat === 'arte_y_diseño') return 'Arte y diseño';
                    return cat.charAt(0).toUpperCase() + cat.slice(1).replace(/_/g, ' ');
                };
                let cat = normalizeCategory(d.product?.item?.category || d.product?.category || d.product?.type || 'Sin categoría');
                byCategory[cat] = (byCategory[cat] || 0) + (parseFloat(d.price) * d.amount);
            });
        });
        const categoryLabels = Object.keys(byCategory);
        const categoryTotals = categoryLabels.map(k => byCategory[k]);

        const byProduct = {};
        transactions.forEach(t => {
            t.details.forEach(d => {
                let prod = d.product?.item?.name || d.product?.description || 'Sin nombre';
                byProduct[prod] = (byProduct[prod] || 0) + d.amount;
            });
        });
        const topProducts = Object.entries(byProduct).sort((a, b) => b[1] - a[1]).slice(0, 10);
        const topProductLabels = topProducts.map(([k]) => k);
        const topProductCounts = topProducts.map(([, v]) => v);

        const histogramRanges = [
            { label: "$0–50", min: 0, max: 50 },
            { label: "$50–100", min: 50, max: 100 },
            { label: "$100–300", min: 100, max: 300 },
            { label: "> $300", min: 300, max: Infinity },
        ];
        const histogramCounts = histogramRanges.map(r =>
            transactions.filter(t => t.total >= r.min && t.total < r.max).length
        );

        return {
            totalTransactions,
            totalAmount,
            completedCount,
            pendingCount,
            dayLabels,
            dayTotals,
            dayCounts,
            avgByDay,
            accumulated,
            byHour,
            paymentLabels,
            paymentTotals,
            categoryLabels,
            categoryTotals,
            topProductLabels,
            topProductCounts,
            histogramRanges,
            histogramCounts,
        };
    }, [data, dateFrom, dateTo, period]);

    if (loading) return <div className="p-8 text-center">Cargando dashboard...</div>;
    if (error) return <div className="p-8 text-center text-red-600">{error}</div>;
    if (!metrics)
        return <div className="p-8 text-center">No hay datos para mostrar.</div>;

    const handleExportExcel = () => {
        if (!metrics) {
            alert("Carga el dashboard antes de exportar métricas.");
            return;
        }
        const wb = XLSX.utils.book_new();
        const resumen = [
            ["Métrica", "Valor"],
            ["Total transacciones", metrics.totalTransactions],
            ["Ingresos totales", metrics.totalAmount],
            ["Ticket promedio", metrics.totalTransactions ? (metrics.totalAmount / metrics.totalTransactions).toFixed(2) : 0],
            ["Generado el", new Date().toLocaleString()],
            [],
            ["Tamaño de compra"],
            ["Rango", "Cantidad"],
            ...metrics.histogramRanges.map((r, i) => [r.label, metrics.histogramCounts[i]])
        ];
        const wsResumen = XLSX.utils.aoa_to_sheet(resumen);
        XLSX.utils.book_append_sheet(wb, wsResumen, "Resumen");

        const evoHeaders = ["Fecha", "Ventas", "Transacciones", "Ingresos acumulados"];
        const evoRows = (metrics.dayLabels || []).map((label, i) => [
            label,
            metrics.dayTotals[i],
            metrics.dayCounts[i],
            metrics.accumulated[i]
        ]);
        const wsEvo = XLSX.utils.aoa_to_sheet([evoHeaders, ...evoRows]);
        XLSX.utils.book_append_sheet(wb, wsEvo, "Evolución temporal");

        const catHeaders = ["Categoría", "Ingresos"];
        const catRows = (metrics.categoryLabels || []).map((label, i) => [label, metrics.categoryTotals[i]]);
        const wsCat = XLSX.utils.aoa_to_sheet([catHeaders, ...catRows]);
        XLSX.utils.book_append_sheet(wb, wsCat, "Ventas por categoría");

        const prodHeaders = ["Producto", "Cantidad"];
        const prodRows = (metrics.topProductLabels || []).map((label, i) => [label, metrics.topProductCounts[i]]);
        const wsProd = XLSX.utils.aoa_to_sheet([prodHeaders, ...prodRows]);
        XLSX.utils.book_append_sheet(wb, wsProd, "Ventas por producto");

        const txHeaders = ["ID", "Tipo", "Producto(s)", "Fecha", "Usuario", "Total", "Estado", "Método pago"];
        const txRows = (data || []).map(t => [
            t.id_transaction,
            t.type || "",
            (t.details || []).map(d => d.product?.item?.name || d.product?.description || "").join(", "),
            t.date ? new Date(t.date).toLocaleString() : "",
            t.id_user,
            t.total,
            t.status,
            t.payment_method
        ]);
        const wsTx = XLSX.utils.aoa_to_sheet([txHeaders, ...txRows]);
        XLSX.utils.book_append_sheet(wb, wsTx, "Transacciones");

        XLSX.writeFile(wb, `metricas-dashboard-${new Date().toISOString().slice(0, 16).replace(/[-T:]/g, "")}.xlsx`);
    };

    return (
        <section className="text-center">
            <div className='relative top-[104px] w-full p-10 flex items-center justify-evenly flex-col text-black'>
                <div className="w-full p-6 flex items-center justify-center flex-col">
                    <h1 className="text-2xl font-bold mb-6 text-center">Dashboard de Transacciones</h1>
                    <div className="flex flex-wrap gap-4 mb-8 items-center justify-end w-full">
                        <button
                            className="bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-2 rounded shadow cursor-pointer"
                            onClick={handleExportExcel}
                        >
                            Exportar métricas a Excel
                        </button>
                        <div className="bg-gray-200 rounded-lg px-4 py-2 flex items-center">
                            <select
                                className="min-w-[170px] bg-transparent border-0 text-base outline-none cursor-pointer"
                                value={period}
                                onChange={e => {
                                    setPeriod(e.target.value);
                                    if (e.target.value !== 'range') {
                                        setDateFrom("");
                                        setDateTo("");
                                    }
                                }}
                            >
                                <option value="all">Todo el historial</option>
                                <option value="today">Hoy</option>
                                <option value="week">Esta semana</option>
                                <option value="month">Este mes</option>
                                <option value="range">Rango personalizado</option>
                            </select>
                        </div>
                        {period === 'range' && (
                            <>
                                <input
                                    type="date"
                                    className="border rounded px-2 py-1 w-[130px]"
                                    value={dateFrom}
                                    onChange={e => setDateFrom(e.target.value)}
                                    max={dateTo || undefined}
                                />
                                <input
                                    type="date"
                                    className="border rounded px-2 py-1 w-[130px]"
                                    value={dateTo}
                                    onChange={e => setDateTo(e.target.value)}
                                    min={dateFrom || undefined}
                                />
                            </>
                        )}
                    </div>
                    <div className="w-[70%] grid grid-cols-2 gap-6 mb-8">
                        <div className="bg-white rounded shadow p-4 flex flex-col items-center">
                            <div className="text-3xl font-bold text-blue-700">{metrics.totalTransactions}</div>
                            <div className="text-gray-600">Total de transacciones</div>
                        </div>
                        <div className="bg-white rounded shadow p-4 flex flex-col items-center">
                            <div className="text-3xl font-bold text-green-700">${metrics.totalAmount.toFixed(2)}</div>
                            <div className="text-gray-600">Ingresos totales</div>
                        </div>
                        <div className="bg-white rounded shadow p-4 flex flex-col items-center">
                            <div className="text-2xl font-bold text-green-600">{metrics.completedCount}</div>
                            <div className="text-gray-600">Completadas</div>
                        </div>
                        <div className="bg-white rounded shadow p-4 flex flex-col items-center">
                            <div className="text-2xl font-bold text-yellow-600">{metrics.pendingCount}</div>
                            <div className="text-gray-600">Pendientes</div>
                        </div>
                    </div>
                    <div className="w-[80%] flex flex-col gap-8 items-center">
                        <div className="w-[800px] h-[400px] bg-white rounded shadow p-4 flex flex-col items-center">
                            <div className="font-bold mb-2">Ingresos por día</div>
                            <Line className="pb-8"
                                data={{
                                    labels: metrics.dayLabels,
                                    datasets: [
                                        { label: 'Ingresos', data: metrics.dayTotals, borderColor: '#3182ce', backgroundColor: 'rgba(49,130,206,0.2)', tension: 0.3, fill: true },
                                    ],
                                }}
                                options={{ responsive: true, plugins: { legend: { position: 'top' } } }}
                            />
                        </div>
                        <div className="w-[800px] h-[400px] bg-white rounded shadow p-4 flex flex-col items-center">
                            <div className="font-bold mb-2">Ingreso acumulado</div>
                            <Line className="pb-8"
                                data={{
                                    labels: metrics.dayLabels,
                                    datasets: [
                                        { label: 'Acumulado', data: metrics.accumulated, borderColor: '#38a169', backgroundColor: 'rgba(56,161,105,0.1)', tension: 0.3, fill: true },
                                    ],
                                }}
                                options={{ responsive: true, plugins: { legend: { position: 'top' } } }}
                            />
                        </div>
                        <div className="w-full flex gap-6 justify-evenly">
                            <div className="w-[700px] h-[400px] bg-white rounded shadow p-4 flex flex-col items-center">
                                <div className="font-bold mb-2">Ticket promedio por día</div>
                                <Line
                                    data={{
                                        labels: metrics.dayLabels,
                                        datasets: [
                                            { label: 'Ticket promedio', data: metrics.avgByDay, borderColor: '#805ad5', backgroundColor: 'rgba(128,90,213,0.2)', tension: 0.3, fill: true },
                                        ],
                                    }}
                                    options={{ responsive: true, plugins: { legend: { position: 'top' } } }}
                                />
                            </div>
                            <div className="w-[700px] h-[400px] bg-white rounded shadow p-4 flex flex-col items-center">
                                <div className="font-bold mb-2">Ingresos por hora del día</div>
                                <Line
                                    data={{
                                        labels: Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`),
                                        datasets: [
                                            { label: 'Ingresos', data: metrics.byHour, borderColor: '#e53e3e', backgroundColor: 'rgba(229,62,62,0.2)', tension: 0.3, fill: true },
                                        ],
                                    }}
                                    options={{ responsive: true, plugins: { legend: { position: 'top' } } }}
                                />
                            </div>
                        </div>
                        <div className="w-full flex gap-6 justify-evenly">
                            <div className="w-[350px] bg-white rounded shadow p-4 flex flex-col items-center">
                                <div className="font-bold mb-2">Distribución de métodos de pago</div>
                                <Pie
                                    data={{
                                        labels: metrics.paymentLabels,
                                        datasets: [
                                            { label: 'Ingresos', data: metrics.paymentTotals, backgroundColor: ['#3182ce', '#38a169', '#e53e3e', '#ecc94b', '#805ad5', '#319795', '#d53f8c'] },
                                        ],
                                    }}
                                    options={{ responsive: true, plugins: { legend: { position: 'top' } } }}
                                />
                            </div>
                            <div className="w-[350px] bg-white rounded shadow p-4 flex flex-col items-center">
                                <div className="font-bold mb-2">Ingresos por categoría</div>
                                <Pie
                                    data={{
                                        labels: metrics.categoryLabels,
                                        datasets: [
                                            { label: 'Ingresos', data: metrics.categoryTotals, backgroundColor: ['#3182ce', '#38a169', '#e53e3e', '#ecc94b', '#805ad5', '#319795', '#d53f8c', '#718096'] },
                                        ],
                                    }}
                                    options={{ responsive: true, plugins: { legend: { position: 'top' } } }}
                                />
                            </div>
                        </div>
                        <div className="w-full flex gap-6 justify-evenly">
                            <div className="w-[700px] h-[400px] bg-white rounded shadow p-4 flex flex-col items-center">
                                <div className="font-bold mb-2">Productos más vendidos</div>
                                <Bar
                                    data={{
                                        labels: metrics.topProductLabels,
                                        datasets: [
                                            { label: 'Cantidad', data: metrics.topProductCounts, backgroundColor: '#3182ce' },
                                        ],
                                    }}
                                    options={{ responsive: true, plugins: { legend: { display: false } } }}
                                />
                            </div>
                            <div className="w-[700px] h-[400px] bg-white rounded shadow p-4 flex flex-col items-center">
                                <div className="font-bold mb-2">Histograma de montos de compra</div>
                                <Bar
                                    data={{
                                        labels: metrics.histogramRanges.map(r => r.label),
                                        datasets: [
                                            { label: 'Cantidad', data: metrics.histogramCounts, backgroundColor: '#805ad5' },
                                        ],
                                    }}
                                    options={{ responsive: true, plugins: { legend: { display: false } } }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
