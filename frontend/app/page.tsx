"use client";
import Layout from '@/components/Layout';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { Activity, Dna, AppWindow, Users } from 'lucide-react';

interface SummaryData {
    samples: number;
    genes: number;
    taxa: number;
    groups: string[];
}

export default function Home() {
    const [data, setData] = useState<SummaryData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await axios.get('http://localhost:8000/api/omics/summary');
                setData(res.data);
            } catch (e) {
                console.error("Failed to fetch summary", e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    return (
        <Layout>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800">Multi-Omic Biomarker Analysis Platform</h1>
                <div className="mt-4 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <h2 className="text-lg font-semibold text-slate-700 mb-2">Project Overview</h2>
                    <p className="text-slate-600 leading-relaxed">
                        We used total RNA of nasopharyngeal swabs from COVID-19 patients to identify their gene expression profile. Multiple biological process were significantly enriched in either asymptomatic or mildly symptomatic patients. These significantly expressed genes were suggested to contribute to the severity of the disease. We also performed metagenomics analysis to identify differences in the microbiome profile of the two groups of patients.
                    </p>
                    <p className="text-slate-600 leading-relaxed mt-2 italic">
                        <strong>Overall design:</strong> Gene expression and metagenomic profile of nasopharynx tissue from 2 asymptomatic and 2 mildly symptomatic COVID-19 patients.
                    </p>
                </div>
            </div>



            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                    title="Total Samples"
                    value={loading || !data ? "..." : data.samples}
                    icon={<Users className="text-blue-500" />}
                    color="bg-blue-50"
                />
                <StatCard
                    title="Genes Analyzed"
                    value={loading || !data ? "..." : data.genes.toLocaleString()}
                    icon={<Dna className="text-purple-500" />}
                    color="bg-purple-50"
                />
                <StatCard
                    title="Microbial Taxa"
                    value={loading || !data ? "..." : data.taxa.toLocaleString()}
                    icon={<Activity className="text-green-500" />}
                    color="bg-green-50"
                />
                <StatCard
                    title="Groups"
                    value={loading || !data ? "..." : data.groups.length}
                    icon={<AppWindow className="text-orange-500" />}
                    color="bg-orange-50"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <h2 className="text-xl font-semibold mb-4 text-slate-700">Study Groups</h2>
                    <div className="space-y-3">
                        {data?.groups.map((g, i) => (
                            <div key={i} className="flex items-center p-3 bg-slate-50 rounded-lg">
                                <div className={`w-3 h-3 rounded-full mr-3 ${i % 2 === 0 ? 'bg-blue-400' : 'bg-pink-400'}`}></div>
                                <span className="text-slate-700 font-medium">{g}</span>
                            </div>
                        ))}
                        {loading && <div className="text-slate-400 text-sm">Loading groups...</div>}
                    </div>
                </div>

                <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-xl shadow-lg text-white">
                    <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-1 gap-4">
                        <ActionCard title="Run Differential Expression" desc="Analyze gene expression differences between groups" href="/transcriptomics" />
                        <ActionCard title="Analyze Diversity" desc="Calculate Alpha/Beta diversity of microbiome" href="/metagenomics" />
                    </div>
                </div>
            </div>

            <div className="mt-8 bg-slate-50 p-6 rounded-xl border border-slate-200">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Manuscript Citation</h3>
                <p className="text-slate-700 italic">
                    "RNA sequence analysis of nasopharyngeal swabs from asymptomatic and mildly symptomatic patients with COVID-19"
                </p>
                <p className="text-sm text-slate-600 mt-2">
                    DOI: <a href="https://doi.org/10.1016/j.ijid.2022.06.035" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">10.1016/j.ijid.2022.06.035</a>
                </p>
                <p className="text-sm text-slate-500 mt-1">
                    Please cite the original study when using this data.
                </p>
            </div>
        </Layout >
    );
}


const StatCard = ({ title, value, icon, color }: any) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center space-x-4">
        <div className={`p-3 rounded-lg ${color}`}>
            {icon}
        </div>
        <div>
            <p className="text-sm text-slate-500 font-medium">{title}</p>
            <p className="text-2xl font-bold text-slate-800">{value}</p>
        </div>
    </div>
);

const ActionCard = ({ title, desc, href }: any) => (
    <a href={href} className="block p-4 rounded-lg bg-white/10 hover:bg-white/20 transition-all border border-white/10 cursor-pointer">
        <h3 className="font-semibold text-blue-200">{title}</h3>
        <p className="text-sm text-slate-300 mt-1">{desc}</p>
    </a>
);
