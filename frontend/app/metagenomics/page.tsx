"use client";
import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Layout from '@/components/Layout';
import axios from 'axios';
import { PieChart, Activity } from 'lucide-react';

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

export default function Metagenomics() {
    const [loading, setLoading] = useState(true);
    const [compositionData, setCompositionData] = useState<any[]>([]);
    const [diversityData, setDiversityData] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [compRes, divRes] = await Promise.all([
                    axios.get('http://localhost:8000/api/omics/metagenomics/composition'),
                    axios.get('http://localhost:8000/api/omics/metagenomics/diversity')
                ]);
                setCompositionData(compRes.data);
                setDiversityData(divRes.data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Prepare Composition Data for Stacked Bar
    // data is [{Sample, Genus1: val, Genus2: val...}, ...]
    // Need traces for each Genus
    const getCompositionTraces = () => {
        if (compositionData.length === 0) return [];

        const samples = compositionData.map(d => d.Sample);
        const taxa = Object.keys(compositionData[0]).filter(k => k !== 'Sample');

        return taxa.map(taxon => ({
            x: samples,
            y: compositionData.map(d => d[taxon]),
            name: taxon,
            type: 'bar',
            hovertemplate: '%{y:.2%} <extra></extra>'
        }));
    };

    // Prepare Diversity Data for Box Plot
    const getDiversityTraces = () => {
        if (diversityData.length === 0) return [];

        const groups = [...new Set(diversityData.map(d => d['Disease severity']))];


        return groups.map(group => {
            const groupData = diversityData.filter(d => d['Disease severity'] === group);
            return {
                y: groupData.map(d => d.shannon),
                type: 'box',
                name: group,
                boxpoints: 'all',
                jitter: 0.3,
                pointpos: -1.8,
                marker: { color: group === 'Asymptomatic' ? '#60A5FA' : '#F472B6' }
            };
        });
    };

    // Prepare Beta Diversity (PCoA) Traces
    const getBetaTraces = () => {
        if (diversityData.length === 0) return [];

        // Check if PC1 exists
        if (!diversityData[0].PC1) return [];

        const groups = [...new Set(diversityData.map(d => d['Disease severity']))];

        return groups.map(group => {
            const groupData = diversityData.filter(d => d['Disease severity'] === group);
            return {
                x: groupData.map(d => d.PC1),
                y: groupData.map(d => d.PC2),
                mode: 'markers',
                type: 'scatter',
                name: group,
                text: groupData.map(d => d.Sample),
                marker: {
                    size: 12,
                    color: group === 'Asymptomatic' ? '#60A5FA' : '#F472B6',
                    line: { color: 'white', width: 1 }
                }
            };
        });
    };

    return (
        <Layout>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800">Metagenomics</h1>
                <p className="text-slate-500 mt-2">Microbial Community Analysis</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Alpha Diversity */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-[500px]">
                    <div className="flex items-center space-x-2 mb-4">
                        <Activity className="text-green-500" size={20} />
                        <h3 className="text-lg font-semibold">Alpha Diversity (Shannon Index)</h3>
                    </div>
                    {!loading && (
                        <Plot
                            data={getDiversityTraces() as any}
                            layout={{
                                autosize: true,
                                showlegend: false,
                                margin: { t: 20, r: 20, b: 40, l: 40 },
                                yaxis: { title: { text: 'Shannon Index' } }
                            }}
                            useResizeHandler={true}
                            style={{ width: '100%', height: '100%' }}
                        />
                    )}
                </div>

                {/* Beta Diversity (PCoA) */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-[500px]">
                    <div className="flex items-center space-x-2 mb-4">
                        <Activity className="text-purple-500" size={20} />
                        <h3 className="text-lg font-semibold">Beta Diversity (Bray-Curtis PCoA)</h3>
                    </div>
                    {!loading && (
                        <Plot
                            data={getBetaTraces() as any}
                            layout={{
                                autosize: true,
                                margin: { t: 20, r: 20, b: 40, l: 40 },
                                xaxis: { title: { text: 'PC1' } },
                                yaxis: { title: { text: 'PC2' } },
                                hovermode: 'closest'
                            }}
                            useResizeHandler={true}
                            style={{ width: '100%', height: '100%' }}
                        />
                    )}
                </div>
            </div>

            {/* Composition Bar Chart */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-[600px]">
                <div className="flex items-center space-x-2 mb-4">
                    <PieChart className="text-blue-500" size={20} />
                    <h3 className="text-lg font-semibold">Taxonomic Composition (Top Genus)</h3>
                </div>
                {!loading && (
                    <Plot
                        data={getCompositionTraces() as any}
                        layout={{
                            barmode: 'stack',
                            autosize: true,
                            margin: { t: 20, r: 20, b: 100, l: 50 },
                            xaxis: { title: { text: 'Samples' }, tickangle: -45 },
                            yaxis: { title: { text: 'Relative Abundance' } },
                            legend: { orientation: 'h', y: -0.2 }
                        }}
                        useResizeHandler={true}
                        style={{ width: '100%', height: '100%' }}
                    />
                )}
            </div>
        </Layout>
    );
}
