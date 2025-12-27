"use client";
import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Layout from '@/components/Layout';
import axios from 'axios';
import { Download, Filter, ArrowUpDown, Network, Pilcrow, Activity } from 'lucide-react';


const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

const TabButton = ({ id, label, icon, active, onClick }: any) => (
    <button
        onClick={() => onClick(id)}
        className={`pb-3 flex items-center space-x-2 text-sm font-medium transition-colors border-b-2 ${active === id ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
    >
        {icon}
        <span>{label}</span>
    </button>
);

const EnrichmentView = ({ data }: any) => {
    if (!data) return <div className="text-slate-500 text-center py-8">No enrichment data found.</div>;
    const goData = data['GO_Biological_Process_2023'] || [];
    const keggData = data['KEGG_2021_Human'] || [];
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-[400px]">
                <h3 className="text-lg font-semibold mb-2">GO Biological Process</h3>
                <Plot
                    data={[{
                        x: goData.map((d: any) => -Math.log10(d.p_value)),
                        y: goData.map((d: any) => d.term.split('(')[0]),
                        type: 'bar',
                        orientation: 'h',
                        marker: { color: '#8884d8' }
                    }]}
                    layout={{ margin: { l: 250 }, xaxis: { title: { text: '-Log10 P-value' } }, autosize: true }}
                    useResizeHandler={true}
                    style={{ width: '100%', height: '100%' }}
                />
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-[400px]">
                <h3 className="text-lg font-semibold mb-2">KEGG Pathways</h3>
                <Plot
                    data={[{
                        x: keggData.map((d: any) => -Math.log10(d.p_value)),
                        y: keggData.map((d: any) => d.term.split('(')[0]),
                        type: 'bar',
                        orientation: 'h',
                        marker: { color: '#82ca9d' }
                    }]}
                    layout={{ margin: { l: 250 }, xaxis: { title: { text: '-Log10 P-value' } }, autosize: true }}
                    useResizeHandler={true}
                    style={{ width: '100%', height: '100%' }}
                />
            </div>
        </div>
    );
};

const PPIView = ({ data }: any) => {
    if (!data || data.length === 0) return <div className="text-slate-500 text-center py-8">No PPI interactions found.</div>;
    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-semibold mb-4">Protein-Protein Interactions (STRING DB)</h3>
            <div className="overflow-x-auto h-[400px]">
                <table className="w-full text-sm text-left text-slate-500">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-50 sticky top-0">
                        <tr>
                            <th className="px-6 py-3">Protein A</th>
                            <th className="px-6 py-3">Protein B</th>
                            <th className="px-6 py-3">Score</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.slice(0, 50).map((d: any, i: number) => (
                            <tr key={i} className="bg-white border-b">
                                <td className="px-6 py-2">{d.preferredName_A}</td>
                                <td className="px-6 py-2">{d.preferredName_B}</td>
                                <td className="px-6 py-2">{d.score}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const DrugView = ({ data }: any) => {
    if (!data || data.length === 0) return <div className="text-slate-500 text-center py-8">No drug interactions found.</div>;
    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-semibold mb-4">Potential Drug Targets (DGIdb)</h3>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-500">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                        <tr>
                            <th className="px-6 py-3">Gene</th>
                            <th className="px-6 py-3">Drug</th>
                            <th className="px-6 py-3">Interaction Type</th>
                            <th className="px-6 py-3">Score</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((d: any, i: number) => (
                            <tr key={i} className="bg-white border-b">
                                <td className="px-6 py-4 font-bold">{d.gene}</td>
                                <td className="px-6 py-4 text-blue-600">{d.drug}</td>
                                <td className="px-6 py-4">{d.interaction_type.join(', ')}</td>
                                <td className="px-6 py-4">{d.score}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default function Transcriptomics() {
    const [activeTab, setActiveTab] = useState('dea');
    const [groups, setGroups] = useState<string[]>([]);
    const [selectedGroups, setSelectedGroups] = useState({ g1: '', g2: '' });
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);


    // Advanced Analysis States
    const [enrichment, setEnrichment] = useState<any>(null);
    const [ppi, setPpi] = useState<any>(null);
    const [drugs, setDrugs] = useState<any>(null);
    const [advancedLoading, setAdvancedLoading] = useState(false);


    useEffect(() => {
        // Fetch available groups
        axios.get('http://localhost:8000/api/omics/summary').then(res => {
            setGroups(res.data.groups);
            if (res.data.groups.length >= 2) {
                setSelectedGroups({ g1: res.data.groups[0], g2: res.data.groups[1] });
            }
        });
    }, []);

    const runAdvancedAnalysis = async (deaData: any[]) => {
        setAdvancedLoading(true);
        // Get significant genes (Log2FC > 2, P < 0.01)
        const sigGenes = deaData.filter(d => d.p_value < 0.01 && Math.abs(d.logFC) > 2).map(d => d.gene).slice(0, 100); // Limit to top 100

        if (sigGenes.length === 0) {
            setAdvancedLoading(false);
            return;
        }

        try {
            // Parallel requests
            const [enrichRes, ppiRes, drugRes] = await Promise.all([
                axios.post('http://localhost:8000/api/omics/transcriptomics/enrichment', { genes: sigGenes }),
                axios.post('http://localhost:8000/api/omics/transcriptomics/ppi', { genes: sigGenes }),
                axios.post('http://localhost:8000/api/omics/transcriptomics/drugs', { genes: sigGenes })
            ]);

            setEnrichment(enrichRes.data);
            setPpi(ppiRes.data);
            setDrugs(drugRes.data);

        } catch (e) {
            console.error("Advanced analysis failed", e);
        } finally {
            setAdvancedLoading(false);
        }
    };

    const runAnalysis = async () => {
        setLoading(true);
        // Reset advanced states
        setEnrichment(null);
        setPpi(null);
        setDrugs(null);

        try {
            const res = await axios.get('http://localhost:8000/api/omics/transcriptomics/dea', {
                params: { group1: selectedGroups.g1, group2: selectedGroups.g2 }
            });
            setData(res.data);

            // Trigger advanced analysis in background
            runAdvancedAnalysis(res.data);

        } catch (err) {
            console.error(err);
            alert('Analysis failed');
        } finally {
            setLoading(false);
        }
    };


    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedData = [...data].filter(d => d.p_value < 0.01 && Math.abs(d.logFC) > 2).sort((a, b) => {
        if (!sortConfig) return 0;
        const { key, direction } = sortConfig;
        if (a[key] < b[key]) return direction === 'asc' ? -1 : 1;
        if (a[key] > b[key]) return direction === 'asc' ? 1 : -1;
        return 0;
    });

    const downloadCSV = () => {
        const headers = ["Gene", "LogFC", "P-value", "Adj P-value"];
        const rows = sortedData.map(d => [d.gene, d.logFC, d.p_value, d.adj_p_value]);
        const csvContent = "data:text/csv;charset=utf-8," +
            [headers.join(","), ...rows.map(e => e.join(","))].join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `dea_results_${selectedGroups.g1}_vs_${selectedGroups.g2}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Layout>
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Transcriptomics</h1>
                    <p className="text-slate-500 mt-2">Differential Expression Analysis (DEA)</p>
                </div>
                <div className="flex space-x-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200 items-center">
                    <div className="flex bg-slate-100 rounded-lg p-1">
                        <select
                            className="bg-transparent text-sm font-medium px-3 py-1 outline-none text-slate-700"
                            value={selectedGroups.g1}
                            onChange={(e) => setSelectedGroups({ ...selectedGroups, g1: e.target.value })}
                        >
                            {groups.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                        <span className="text-slate-400 px-2 flex items-center">vs</span>
                        <select
                            className="bg-transparent text-sm font-medium px-3 py-1 outline-none text-slate-700"
                            value={selectedGroups.g2}
                            onChange={(e) => setSelectedGroups({ ...selectedGroups, g2: e.target.value })}
                        >
                            {groups.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                    </div>
                    <button
                        onClick={runAnalysis}
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Running...' : 'Run Analysis'}
                    </button>
                </div>
            </div>

            {data.length > 0 && (
                <div className="grid grid-cols-1 gap-8">
                    {/* Interpretation Section */}
                    <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-xl">
                        <h3 className="text-lg font-bold text-blue-900 mb-2">Biological Context (COVID-19)</h3>
                        <p className="text-blue-800 leading-relaxed">
                            Comparing <strong>{selectedGroups.g1}</strong> vs <strong>{selectedGroups.g2}</strong> reveals significant transcriptomic shifts.
                            In the context of COVID-19 (GSE186651), differentially expressed genes often relate to the <strong>host immune response</strong>, including cytokine signaling (e.g., IL-6, TNF pathways) and interferon-stimulated genes.
                            <br /><br />
                            <strong>Interpretation of LogFC:</strong> Positive values indicate upregulation in {selectedGroups.g1}, while negative values indicate upregulation in {selectedGroups.g2}.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-[500px]">
                            <h3 className="text-lg font-semibold mb-2">Volcano Plot</h3>
                            <Plot
                                data={[
                                    {
                                        x: data.map(d => d.logFC),
                                        y: data.map(d => -Math.log10(d.p_value)),
                                        mode: 'markers',
                                        type: 'scatter',
                                        text: data.map(d => d.gene),
                                        marker: {
                                            color: data.map(d => {
                                                if (d.p_value >= 0.01) return '#94A3B8'; // Grey (NS)
                                                if (d.logFC > 2) return '#EF4444'; // Red (Up)
                                                if (d.logFC < -2) return '#3B82F6'; // Blue (Down)
                                                return '#94A3B8'; // Grey (Sig but low fold change)
                                            }),
                                            size: 6,
                                            opacity: 0.7
                                        }
                                    }
                                ]}
                                layout={{
                                    autosize: true,
                                    margin: { t: 20, r: 20, b: 40, l: 40 },
                                    xaxis: { title: { text: 'Log2 Fold Change' } },
                                    yaxis: { title: { text: '-Log10 P-value' } },
                                    hovermode: 'closest'
                                }}
                                useResizeHandler={true}
                                style={{ width: '100%', height: '100%' }}
                            />
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold">Top Biomarkers</h3>
                                <button
                                    onClick={downloadCSV}
                                    className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
                                >
                                    <Download size={16} />
                                    <span>Export CSV</span>
                                </button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left text-slate-500">
                                    <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                                        <tr>
                                            <th className="px-6 py-3">Gene</th>
                                            <th
                                                className="px-6 py-3 cursor-pointer hover:bg-slate-200"
                                                onClick={() => handleSort('logFC')}
                                            >
                                                <div className="flex items-center space-x-1">
                                                    <span>LogFC</span>
                                                    <ArrowUpDown size={14} className="text-slate-400" />
                                                </div>
                                            </th>
                                            <th
                                                className="px-6 py-3 cursor-pointer hover:bg-slate-200"
                                                onClick={() => handleSort('p_value')}
                                            >
                                                <div className="flex items-center space-x-1">
                                                    <span>P-value</span>
                                                    <ArrowUpDown size={14} className="text-slate-400" />
                                                </div>
                                            </th>
                                            <th
                                                className="px-6 py-3 cursor-pointer hover:bg-slate-200"
                                                onClick={() => handleSort('adj_p_value')}
                                            >
                                                <div className="flex items-center space-x-1">
                                                    <span>Adj. P-value</span>
                                                    <ArrowUpDown size={14} className="text-slate-400" />
                                                </div>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sortedData
                                            .slice(0, 10)
                                            .map((d, i) => (
                                                <tr key={i} className="bg-white border-b hover:bg-slate-50">
                                                    <td className="px-6 py-4 font-medium text-slate-900">{d.gene}</td>
                                                    <td className="px-6 py-4 font-mono text-xs">{d.logFC.toFixed(3)}</td>
                                                    <td className="px-6 py-4 font-mono text-xs">{d.p_value.toExponential(2)}</td>
                                                    <td className="px-6 py-4 font-mono text-xs">{d.adj_p_value ? d.adj_p_value.toExponential(2) : '-'}</td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>
                            <p className="text-xs text-slate-400 mt-4 text-center">Top 10 significant genes shown. Download full list for more.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Advanced Analysis Tabs */}
            {data.length > 0 && (
                <div className="mt-12">
                    <div className="border-b border-slate-200 mb-6 flex space-x-6">
                        <TabButton id="dea" label="Differential Expression" icon={<Filter size={16} />} active={activeTab} onClick={setActiveTab} />
                        <TabButton id="enrichment" label="Pathway Enrichment" icon={<Pilcrow size={16} />} active={activeTab} onClick={setActiveTab} />
                        <TabButton id="ppi" label="PPI Network" icon={<Network size={16} />} active={activeTab} onClick={setActiveTab} />
                        <TabButton id="drugs" label="Drug Targets" icon={<Activity size={16} />} active={activeTab} onClick={setActiveTab} />
                    </div>

                    {advancedLoading && activeTab !== 'dea' && (
                        <div className="p-12 text-center text-slate-500">
                            Running advanced bioinformatics analysis... (Enrichr, STRING, DGIdb)
                        </div>
                    )}

                    {!advancedLoading && activeTab === 'enrichment' && <EnrichmentView data={enrichment} />}
                    {!advancedLoading && activeTab === 'ppi' && <PPIView data={ppi} />}
                    {!advancedLoading && activeTab === 'drugs' && <DrugView data={drugs} />}

                </div>
            )}


            {data.length === 0 && !loading && (
                <div className="text-center py-20 text-slate-400 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                    <Filter className="mx-auto h-12 w-12 mb-4 text-slate-300" />
                    <p className="text-lg">Select groups and run analysis to view results</p>
                </div>
            )}
        </Layout>
    );
}

